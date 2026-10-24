"""Independent token interpreter for the pinned PROSITE pattern syntax.

This verifies implementation correspondence, not biological precision/recall.
"""
import re
from bioscribe.registry import PS00107, motif_intervals


def reference_intervals(sequence):
    tokens=PS00107.rstrip('.').split('-')
    def ends(position, token_index):
        if token_index==len(tokens):return [position]
        token=tokens[token_index]
        span=re.fullmatch(r'x\((\d+),(\d+)\)',token)
        if span:
            return [end for size in range(int(span[1]),int(span[2])+1) if position+size<=len(sequence) for end in ends(position+size,token_index+1)]
        if position>=len(sequence):return []
        residue=sequence[position]
        accepts=(token=='x' or (token.startswith('[') and residue in token[1:-1]) or (token.startswith('{') and residue not in token[1:-1]) or token==residue)
        return ends(position+1,token_index+1) if accepts else []
    matches=[]
    for start in range(len(sequence)):
        candidates=ends(start,0)
        if candidates:matches.append((start,max(candidates)))
    return matches


def test_regex_against_independent_reference():
    for span in range(4,20):
        base='LGAGAFSALAAI'+'Q'*span+'LAIK'
        for sequence in [base,base+'QQ'+base,base[:4]+'P'+base[5:], 'GGG'+base, 'A'*100]:
            assert motif_intervals(sequence)==reference_intervals(sequence)
    # Two accepted starts whose match intervals overlap.
    shared='LGAGAFSALAAI'+'LGAGAFSALAAI'+'QQQQQ'+'LAIK'
    assert len(reference_intervals(shared))==2
    assert motif_intervals(shared)==reference_intervals(shared)
