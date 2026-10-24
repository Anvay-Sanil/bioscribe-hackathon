from copy import deepcopy
import math
import pytest
from bioscribe.metrics import evaluate, ranks

def rows(x,y):
    return [dict(compound=str(i),target='target1',source='synthetic_test_fixture',source_version='1',endpoint='test_endpoint',units='test_units',relation='=',prediction=a,label=b,active=(i==0)) for i,(a,b) in enumerate(zip(x,y))]

def test_insufficient_evidence():
    result=evaluate(rows([1,2],[2,1]),'test_endpoint','test_units','test_units')
    assert all(m['value'] is None and m['status']=='insufficient_evidence' for m in result.values())

def test_ties_constants_zero_labels():
    assert ranks([3,1,1,2])==[4,1.5,1.5,3]
    result=evaluate(rows([0,0,1],[0,1,2]),'test_endpoint','test_units','test_units')
    assert result['spearman']['value']==pytest.approx(math.sqrt(3)/2)
    assert result['pearson']['n']==3
    result=evaluate(rows([1,1,1],[0,1,2]),'test_endpoint','test_units','test_units')
    assert result['pearson']['status']==result['spearman']['status']=='undefined'

def test_exclusions_and_incompatible_units():
    data=rows([0,1,2,3,4],[0,1,2,3,float('nan')])
    data[3]['relation']='<'
    result=evaluate(data,'test_endpoint','test_units','dimensionless_heuristic')
    assert result['pearson']['n']==3
    assert len(result['pearson']['exclusions'])==2
    assert result['rmse']['status']=='undefined'
    data[0]['source']=''
    assert evaluate(data,'test_endpoint','test_units','test_units')['pearson']['status']=='insufficient_evidence'

def test_enrichment_ties_and_undefined():
    data=rows([3,3,1],[0,1,2])
    result=evaluate(data,'test_endpoint','test_units','test_units',k=1)['enrichment']
    assert result['actual_k']==2 and result['value']==1.5
    for row in data:row['active']=False
    assert evaluate(data,'test_endpoint','test_units','test_units')['enrichment']['status']=='undefined'
    data[0]['active']=None
    assert evaluate(data,'test_endpoint','test_units','test_units')['enrichment']['status']=='insufficient_evidence'

def test_target_mismatch():
    data=rows([1,2,3],[1,2,3]);data[0]['target']='different'
    with pytest.raises(ValueError):evaluate(data,'test_endpoint','test_units','test_units')


@pytest.mark.parametrize('direction',['higher','lower'])
@pytest.mark.parametrize('predictions,expected', [([1,2,3],1),([3,2,1],-1)])
def test_numeric_correlation_independent_of_enrichment_direction(direction,predictions,expected):
    data=rows(predictions,[1,2,3])
    for row in data:
        row.update(endpoint='Kd',units='nM')
    result=evaluate(data,'Kd','nM','nM',ranking_direction=direction)
    assert result['pearson']['value']==pytest.approx(expected)
    assert result['spearman']['value']==pytest.approx(expected)
    assert result['rmse']['value']==pytest.approx(0 if expected==1 else math.sqrt(8/3))
    # Only compound 0 is active; it ranks first for lower [1,2,3] or higher [3,2,1].
    best_active=(direction=='lower')==(expected==1)
    assert result['enrichment']['value']==pytest.approx(3 if best_active else 0)
    assert evaluate(data,'Kd','nM','nM',direction=direction)==result
    for metric in result.values():
        assert metric['method_version']=='descriptive_metrics/1.1.0'
        assert metric['ranking_direction']==direction
        assert metric['correlation_basis']=='original_prediction_and_label_values'


def test_ranking_manifest_ties_and_undefined_statistics():
    data=rows([1,1,3],[1,1,3])
    result=evaluate(data,'test_endpoint','test_units','test_units',ranking_direction='lower')
    assert result['pearson']['value']==result['spearman']['value']==1
    assert result['enrichment']['actual_k']==2 and result['enrichment']['value']==1.5
    for values in [[1,1,1],[1,2]]:
        result=evaluate(rows(values,values),'test_endpoint','test_units','test_units',ranking_direction='lower')
        assert result['pearson']['value'] is None
        assert all(metric['ranking_direction']=='lower' for metric in result.values())
    with pytest.raises(ValueError,match='conflicting_ranking_direction'):
        evaluate(data,'test_endpoint','test_units','test_units',direction='higher',ranking_direction='lower')
