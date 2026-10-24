from copy import deepcopy
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from fastapi.testclient import TestClient
from bioscribe.checkpoint_service import checkpoint_app
from bioscribe.checkpoints import chain, verify

def keypair():
    key=Ed25519PrivateKey.generate()
    return key.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption()),key.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw)

@pytest.fixture
def boundary(tmp_path):
    private,public=keypair()
    path=tmp_path/'independent-checkpoints.sqlite3'
    client=TestClient(checkpoint_app(path,private,'key1','r'*48,'w'*48))
    events=[{'log_id':'tenant_a','sequence':i,'actor':'alice','action':'submitted','value':i,'event_id':f'event{i}'} for i in range(1,4)]
    old=None
    for n in range(1,4):
        data={'log_id':'tenant_a','count':n,'head':chain(events[:n]),'previous_head':chain(events[:n-1])}
        response=client.post('/checkpoints',json=data,headers={'Authorization':'Bearer '+'w'*48})
        assert response.status_code==200
        if n==1:old=response.json()
    def fetch(log_id):
        response=client.get('/checkpoints/'+log_id,headers={'Authorization':'Bearer '+'r'*48})
        response.raise_for_status()
        return response.json()
    return client,events,fetch,{'key1':public},path,private,old

def test_honest_restart_and_authentication(boundary):
    client,events,fetch,keys,path,private,_=boundary
    assert verify(events,'tenant_a',fetch,keys)['status']=='verified_against_trusted_checkpoint'
    restarted=TestClient(checkpoint_app(path,private,'key1','r'*48,'w'*48))
    assert restarted.get('/checkpoints/tenant_a',headers={'Authorization':'Bearer '+'r'*48}).json()==fetch('tenant_a')
    assert client.get('/checkpoints/tenant_a').status_code==401
    assert client.post('/checkpoints',json={'log_id':'tenant_a','count':4,'head':'f'*64,'previous_head':chain(events)},headers={'Authorization':'Bearer '+'r'*48}).status_code==401

@pytest.mark.parametrize('attack',['alter','middle_delete','tail_delete','suffix_delete','all_delete','reorder','rebuild','rollback','actor','cross_tenant'])
def test_detect_history_attacks(boundary,attack):
    _,original,fetch,keys,_,_,old=boundary
    events=deepcopy(original)
    if attack=='alter':events[1]['value']=999
    elif attack=='middle_delete':events.pop(1)
    elif attack=='tail_delete':events.pop()
    elif attack=='suffix_delete':events=events[:1]
    elif attack=='all_delete':events=[]
    elif attack=='reorder':events.reverse()
    elif attack=='rebuild':
        events[0]['value']='rewritten'
        # The adversary can recompute all ordinary local checksums.
        assert chain(events)!=chain(original)
    elif attack=='rollback':
        events=events[:1]
        assert old['checkpoint']['head']==chain(events)
    elif attack=='actor':events[0]['actor']='eve'
    elif attack=='cross_tenant':events[0]['log_id']='tenant_b'
    assert verify(events,'tenant_a',fetch,keys)['status']=='integrity_failed'

def test_bad_signature_outage_and_key_rotation(boundary):
    _,events,fetch,keys,path,_,_=boundary
    receipt=fetch('tenant_a');receipt['signature']='invalid'
    assert verify(events,'tenant_a',lambda _:receipt,keys)['status']=='integrity_failed'
    def outage(_):raise ConnectionError()
    assert verify(events,'tenant_a',outage,keys)['status']=='integrity_unverified'
    private,public=keypair()
    rotated=TestClient(checkpoint_app(path,private,'key2','r'*48,'w'*48))
    def fresh(log):return rotated.get('/checkpoints/'+log,headers={'Authorization':'Bearer '+'r'*48}).json()
    assert verify(events,'tenant_a',fresh,{**keys,'key2':public})['status']=='verified_against_trusted_checkpoint'
    assert verify(events,'tenant_a',fresh,keys)['status']=='integrity_failed'

def test_receipt_retry_and_rollback_rejected(boundary):
    client,events,fetch,keys,_,_,_=boundary
    checkpoint=fetch('tenant_a')['checkpoint'].copy();checkpoint.pop('key_id')
    assert client.post('/checkpoints',json=checkpoint,headers={'Authorization':'Bearer '+'w'*48}).status_code==200
    checkpoint.update(count=1,head=chain(events[:1]),previous_head='genesis')
    assert client.post('/checkpoints',json=checkpoint,headers={'Authorization':'Bearer '+'w'*48}).status_code==409
