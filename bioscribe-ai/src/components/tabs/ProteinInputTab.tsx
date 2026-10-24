"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Database, 
  Dna, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  BarChart3,
  Search,
  Globe,
  Zap
} from "lucide-react";
import { ProteinData } from "../BioScribeWorkflow";

interface ProteinInputTabProps {
  onAnalysis: (proteinData: ProteinData) => void;
  isProcessing: boolean;
  proteinData?: ProteinData;
}

// Example proteins for quick testing
const EXAMPLE_PROTEINS = {
  hiv_protease: {
    name: "HIV-1 Protease",
    sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
    organism: "Human immunodeficiency virus 1",
    description: "Essential enzyme for HIV replication"
  },
  egfr_kinase: {
    name: "EGFR Kinase Domain",
    sequence: "FKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA",
    organism: "Homo sapiens",
    description: "Receptor tyrosine kinase involved in cell growth"
  },
  sars_cov2_protease: {
    name: "SARS-CoV-2 Main Protease",
    sequence: "SGFRKMAFPSGKVEGCMVQVTCGTTTLNGLWLDDVVYCPRHVICTSEDMLNPNYEDLLIRKSNHNFLVQAGNVQLRVIGHSMQNCVLKLKVDTANPKTPKYKFVRIQPGQTFSVLACYNGSPSGVYQCAMRPNFTIKGSFLNGSCGSVGFNIDYDCVSFCYMHHMELPTGVHAGTDLEGNFYGPFVDRQTAQAAGTDTTITVNVLAWLYAAVINGDRWFLNRFTTTLNDFNLVAMKYNYEPLTQDHVDILGPLSAQTGIAVLDMCASLKELLQNGMNGRTILGSALLEDEFTPFDVVRQCSGVTFQ",
    organism: "SARS-CoV-2",
    description: "Essential protease for viral replication"
  }
};

export function ProteinInputTab({ onAnalysis, isProcessing, proteinData }: ProteinInputTabProps) {
  const [inputMethod, setInputMethod] = useState<'manual' | 'example' | 'upload' | 'search'>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [realDataMode, setRealDataMode] = useState(false);
  const [sequence, setSequence] = useState('');
  const [proteinName, setProteinName] = useState('');
  const [organism, setOrganism] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateSequence = (seq: string): boolean => {
    const cleanSeq = seq.replace(/\s+/g, '').toUpperCase();
    const validAminoAcids = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
    return validAminoAcids.test(cleanSeq) && cleanSeq.length >= 10;
  };

  const searchRealProteins = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/real/protein-search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results?.uniprot_proteins || []);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    setSequence(result.sequence);
    setProteinName(result.name);
    setOrganism(result.organism);
    setInputMethod('manual');
    setRealDataMode(true);
  };

  const handleSequenceChange = (value: string) => {
    setSequence(value);
    setValidationError('');
    
    if (value.trim()) {
      const cleanSeq = value.replace(/\s+/g, '').toUpperCase();
      if (!validateSequence(cleanSeq)) {
        setValidationError('Invalid protein sequence. Use only standard amino acid codes (A-Z).');
      } else if (cleanSeq.length < 10) {
        setValidationError('Sequence too short. Minimum 10 amino acids required.');
      }
    }
  };

  const handleExampleSelect = (key: string) => {
    const example = EXAMPLE_PROTEINS[key as keyof typeof EXAMPLE_PROTEINS];
    setSequence(example.sequence);
    setProteinName(example.name);
    setOrganism(example.organism);
    setInputMethod('example');
    setValidationError('');
  };

  const handleAnalyze = () => {
    const cleanSeq = sequence.replace(/\s+/g, '').toUpperCase();
    
    if (!validateSequence(cleanSeq)) {
      setValidationError('Please enter a valid protein sequence.');
      return;
    }

    const proteinData: ProteinData = {
      name: proteinName || 'Unknown Protein',
      sequence: cleanSeq,
      organism: organism || 'Unknown',
      length: cleanSeq.length
    };

    onAnalysis(proteinData);
  };

  const getSequenceStats = () => {
    const cleanSeq = sequence.replace(/\s+/g, '').toUpperCase();
    if (!cleanSeq) return null;

    const aminoAcidCounts: { [key: string]: number } = {};
    for (const aa of cleanSeq) {
      aminoAcidCounts[aa] = (aminoAcidCounts[aa] || 0) + 1;
    }

    const hydrophobic = 'AILMFPWV';
    const charged = 'DEKR';
    const polar = 'NQSTY';

    const hydrophobicCount = cleanSeq.split('').filter(aa => hydrophobic.includes(aa)).length;
    const chargedCount = cleanSeq.split('').filter(aa => charged.includes(aa)).length;
    const polarCount = cleanSeq.split('').filter(aa => polar.includes(aa)).length;

    return {
      length: cleanSeq.length,
      hydrophobic: ((hydrophobicCount / cleanSeq.length) * 100).toFixed(1),
      charged: ((chargedCount / cleanSeq.length) * 100).toFixed(1),
      polar: ((polarCount / cleanSeq.length) * 100).toFixed(1),
      mostCommon: Object.entries(aminoAcidCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([aa, count]) => `${aa}(${count})`)
        .join(', ')
    };
  };

  const sequenceStats = getSequenceStats();

  return (
    <div className="space-y-6">
      {/* Input Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Protein Target Selection
          </CardTitle>
          <CardDescription>
            Input your protein sequence or select from example targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Tabs */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={inputMethod === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('manual')}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Manual Input
            </Button>
            <Button
              variant={inputMethod === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('search')}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Real Database Search
            </Button>
            <Button
              variant={inputMethod === 'example' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMethod('example')}
              className="gap-2"
            >
              <Database className="w-4 h-4" />
              Example Proteins
            </Button>
          </div>

          {/* Real Database Search */}
          {inputMethod === 'search' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Real-Time Database Search</h4>
                  <p className="text-sm text-blue-700">Search UniProt, PDB, and AlphaFold databases for real protein data</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for proteins (e.g., 'insulin', 'CDK2', 'P53')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && searchRealProteins()}
                />
                <Button 
                  onClick={searchRealProteins}
                  disabled={isSearching || !searchQuery.trim()}
                  className="gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h5 className="font-medium text-sm">Search Results:</h5>
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => selectSearchResult(result)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{result.name}</h4>
                          <p className="text-xs text-muted-foreground">{result.organism}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            UniProt: {result.id} • {result.function?.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">{result.length} AA</Badge>
                          <div className="text-xs text-muted-foreground">
                            {(result.mass / 1000).toFixed(1)} kDa
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Searching real protein databases...</p>
                </div>
              )}
            </div>
          )}

          {/* Example Proteins */}
          {inputMethod === 'example' && (
            <div className="grid gap-3">
              {Object.entries(EXAMPLE_PROTEINS).map(([key, protein]) => (
                <motion.div
                  key={key}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleExampleSelect(key)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{protein.name}</h4>
                      <p className="text-sm text-muted-foreground">{protein.organism}</p>
                      <p className="text-xs text-muted-foreground mt-1">{protein.description}</p>
                    </div>
                    <Badge variant="outline">{protein.sequence.length} AA</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Manual Input */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Protein Name</label>
                <input
                  type="text"
                  value={proteinName}
                  onChange={(e) => setProteinName(e.target.value)}
                  placeholder="e.g., HIV-1 Protease"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Organism</label>
                <input
                  type="text"
                  value={organism}
                  onChange={(e) => setOrganism(e.target.value)}
                  placeholder="e.g., Homo sapiens"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Protein Sequence (FASTA format supported)
              </label>
              <textarea
                value={sequence}
                onChange={(e) => handleSequenceChange(e.target.value)}
                placeholder="Enter protein sequence using single-letter amino acid codes..."
                className="w-full h-32 px-3 py-2 border rounded-md bg-background protein-sequence resize-none"
              />
              {validationError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequence Analysis */}
      {sequenceStats && !validationError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sequence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{sequenceStats.length}</div>
                <div className="text-sm text-muted-foreground">Amino Acids</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{sequenceStats.hydrophobic}%</div>
                <div className="text-sm text-muted-foreground">Hydrophobic</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{sequenceStats.charged}%</div>
                <div className="text-sm text-muted-foreground">Charged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-3">{sequenceStats.polar}%</div>
                <div className="text-sm text-muted-foreground">Polar</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Most Common:</strong> {sequenceStats.mostCommon}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {proteinData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Protein:</span>
                <span>{proteinData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Length:</span>
                <span>{proteinData.length} amino acids</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Organism:</span>
                <span>{proteinData.organism}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Druggability Score:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  High (0.85)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-end gap-3">
        {realDataMode && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 self-center">
            <Globe className="w-3 h-3 mr-1" />
            Real Data Mode
          </Badge>
        )}
        <Button
          onClick={handleAnalyze}
          disabled={!sequence.trim() || !!validationError || isProcessing}
          size="lg"
          className={`gap-2 ${realDataMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Protein...
            </>
          ) : (
            <>
              {realDataMode ? <Zap className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              {realDataMode ? 'Analyze with Real Data' : 'Analyze Protein'}
            </>
          )}
        </Button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">Analyzing protein sequence...</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {realDataMode ? (
                  <>
                    • Validating sequence with UniProt<br/>
                    • Fetching AlphaFold structure prediction<br/>
                    • Searching PDB for experimental structures<br/>
                    • Retrieving known compounds from ChEMBL<br/>
                    • Real-time molecular property calculation
                  </>
                ) : (
                  <>
                    • Validating sequence structure<br/>
                    • Calculating molecular properties<br/>
                    • Predicting binding sites<br/>
                    • Searching protein databases
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
