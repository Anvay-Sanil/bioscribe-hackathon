"""Descriptive statistics only; no synthetic fallback or predictive certification."""
from math import isfinite, sqrt
from statistics import mean
from .identity import canonical, digest


def ranks(values):
    ordered=sorted(range(len(values)),key=values.__getitem__)
    result=[0.0]*len(values)
    i=0
    while i<len(ordered):
        j=i+1
        while j<len(ordered) and values[ordered[j]]==values[ordered[i]]:
            j+=1
        for index in ordered[i:j]:
            result[index]=(i+1+j)/2
        i=j
    return result


def correlation(x,y):
    mx,my=mean(x),mean(y)
    vx=sum((v-mx)**2 for v in x)
    vy=sum((v-my)**2 for v in y)
    return sum((a-mx)*(b-my) for a,b in zip(x,y))/sqrt(vx*vy) if vx and vy else None


def evaluate(rows,endpoint,units,prediction_units,direction=None,k=1,*,ranking_direction=None):
    """Numerical correlations use original values; direction orders enrichment only.

    ``direction`` remains an explicit compatibility alias for existing callers.
    New callers should use ``ranking_direction``; conflicting declarations fail.
    """
    if direction is not None and ranking_direction is not None and direction != ranking_direction:
        raise ValueError("conflicting_ranking_direction")
    ranking_direction = ranking_direction if ranking_direction is not None else direction if direction is not None else "higher"
    if ranking_direction not in {"higher","lower"} or type(k) is not int or k<1:
        raise ValueError("invalid_evaluation_parameters")
    usable=[]
    exclusions=[]
    for index,row in enumerate(rows):
        reason=None
        if not row.get("source") or not row.get("source_version") or not row.get("target") or not row.get("compound"):
            reason="missing_label_provenance"
        elif row.get("endpoint")!=endpoint or row.get("units")!=units:
            reason="incompatible_endpoint_or_units"
        elif row.get("relation")!="=":
            reason="censored_or_unspecified_relation"
        elif any(isinstance(row.get(key),bool) or not isinstance(row.get(key),(float,int)) or not isfinite(row[key]) for key in ("prediction","label")):
            reason="missing_or_nonfinite_pair"
        if reason:
            exclusions.append({"index":index,"reason":reason})
        else:
            usable.append(row)
    if len({r["target"] for r in usable})>1:
        raise ValueError("mixed_targets_require_separate_evaluations")
    if len({r["compound"] for r in usable})!=len(usable):
        raise ValueError("duplicate_compound_labels_require_aggregation_policy")
    x=[r["prediction"] for r in usable]
    y=[r["label"] for r in usable]
    n=len(usable)
    def finite_manifest(value):
        if isinstance(value,float) and not isfinite(value):
            return {"nonfinite":str(value)}
        if isinstance(value,dict):
            return {key:finite_manifest(item) for key,item in value.items()}
        if isinstance(value,list):
            return [finite_manifest(item) for item in value]
        return value
    manifest_hash=digest(canonical(finite_manifest(rows)))
    def metric(value=None,status="insufficient_evidence",reason="Fewer than three eligible paired labels"):
        return {"value":value,"status":status,"reason":reason,"n":n,"endpoint":endpoint,"units":units,"prediction_units":prediction_units,"method_version":"descriptive_metrics/1.1.0","ranking_direction":ranking_direction,"correlation_basis":"original_prediction_and_label_values","validation_record":None,"evidence_category":"descriptive_statistic","label_manifest_sha256":manifest_hash,"exclusions":exclusions}
    result={name:metric() for name in ("pearson","spearman","rmse","enrichment")}
    if n<3:
        return result
    for name,value in (("pearson",correlation(x,y)),("spearman",correlation(ranks(x),ranks(y)))):
        result[name]=metric(value,"computed" if value is not None else "undefined","Descriptive association only" if value is not None else "Constant vector")
    if prediction_units==units and units!="dimensionless_heuristic":
        result["rmse"]=metric(sqrt(mean([(a-b)**2 for a,b in zip(x,y)])),"computed","Compatible endpoint/units asserted by evaluation caller; provenance still requires review")
    else:
        result["rmse"]=metric(None,"undefined","Incompatible endpoint units")
    if any(type(row.get("active")) is not bool for row in usable):
        result["enrichment"]=metric(None,"insufficient_evidence","Activity labels required for every eligible compound")
    elif k>n or sum(row["active"] for row in usable)==0:
        result["enrichment"]=metric(None,"undefined","Cutoff exceeds population or no actives")
    else:
        ranking_scores=x if ranking_direction=="higher" else [-v for v in x]
        ordered=sorted(zip(ranking_scores,usable),key=lambda pair:pair[0],reverse=True)
        cutoff=ordered[k-1][0]
        selected=[row for score,row in ordered if score>=cutoff]
        actual_k=len(selected)
        ef=(sum(row["active"] for row in selected)/actual_k)/(sum(row["active"] for row in usable)/n)
        result["enrichment"]=metric(ef,"computed","Include entire boundary tie group; labeled eligible population only")
        result["enrichment"].update({"requested_k":k,"actual_k":actual_k,"actual_fraction":actual_k/n,"actives_total":sum(row["active"] for row in usable)})
    return result
