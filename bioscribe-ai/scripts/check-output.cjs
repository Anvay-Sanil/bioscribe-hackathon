// CI receipts belong in the verification output, not in reviewed source fixtures.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
module.exports=function writeCheckOutput(target,data){
  if(process.env.BIOSCRIBE_VERIFICATION_OUTPUT){
    const rel=path.relative(root,path.resolve(target));
    if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Check output outside project');
    target=path.join(process.env.BIOSCRIBE_VERIFICATION_OUTPUT,'client-generated',rel);
  }
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,data);
};
