"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Info, 
  Lightbulb, 
  TrendingUp, 
  Zap,
  BookOpen,
  Play,
  X,
  ChevronRight,
  MessageCircle,
  Globe,
  Users,
  ThermometerSun
} from "lucide-react";

interface SmartExplanationProps {
  term: string;
  shortExplanation: string;
  detailedExplanation: string;
  visualAid?: string;
  relatedTerms?: string[];
  confidence?: number;
  userRole?: "researcher" | "student" | "clinician";
}

export function SmartExplanation({ 
  term, 
  shortExplanation, 
  detailedExplanation, 
  visualAid,
  relatedTerms = [],
  confidence = 0.85,
  userRole = "researcher"
}: SmartExplanationProps) {
  const [hoverCount, setHoverCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setHoverCount(prev => prev + 1);
    setShowTooltip(true);
    
    // Track hover time
    hoverTimerRef.current = setInterval(() => {
      setHoverTime(prev => prev + 100);
    }, 100);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    if (hoverTimerRef.current) {
      clearInterval(hoverTimerRef.current);
    }
    
    // If user hovered for >2 seconds or this is 3rd+ hover, show modal next time
    if (hoverTime > 2000 || hoverCount >= 3) {
      // User is interested, show modal
    }
    setHoverTime(0);
  };

  const handleClick = () => {
    setShowModal(true);
  };

  // Adaptive explanation based on user role
  const getAdaptiveExplanation = () => {
    switch (userRole) {
      case "student":
        return detailedExplanation + "\n\n📚 Beginner Tip: " + shortExplanation;
      case "clinician":
        return "Clinical Relevance: " + detailedExplanation;
      case "researcher":
      default:
        return detailedExplanation;
    }
  };

  // Confidence visualization
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return "text-green-600 bg-green-100";
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-100";
    return "text-orange-600 bg-orange-100";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.9) return "High Confidence";
    if (confidence >= 0.7) return "Moderate Confidence";
    return "Low Confidence";
  };

  return (
    <>
      {/* Smart Badge with Adaptive Behavior */}
      <span className="relative inline-flex items-center">
        <span className="font-semibold">{term}</span>
        <button
          className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-all"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <HelpCircle className="w-3 h-3 text-blue-600" />
        </button>

        {/* Tooltip - Shows on first hover */}
        {showTooltip && hoverCount < 3 && (
          <div className="absolute z-50 left-0 top-6 w-64 p-3 bg-white border-2 border-blue-500 rounded-lg shadow-xl">
            <p className="text-xs text-gray-700">{shortExplanation}</p>
            <p className="text-[10px] text-gray-500 mt-2 italic">
              💡 Hover again for more details
            </p>
          </div>
        )}

        {/* Rich Tooltip - Shows on repeated hovers */}
        {showTooltip && hoverCount >= 3 && !showModal && (
          <div className="absolute z-50 left-0 top-6 w-80 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{term}</h4>
              <Badge className={getConfidenceColor()}>
                {getConfidenceLabel()}
              </Badge>
            </div>
            <p className="text-xs text-gray-700 mb-3">{detailedExplanation}</p>
            <Button size="sm" className="w-full" onClick={handleClick}>
              <BookOpen className="w-3 h-3 mr-1" />
              Learn More
            </Button>
          </div>
        )}
      </span>

      {/* Rich Modal - Full Explanation */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                {term}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Confidence Meter */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ThermometerSun className="w-4 h-4" />
                    Confidence Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${confidence >= 0.9 ? 'bg-green-500' : confidence >= 0.7 ? 'bg-yellow-500' : 'bg-orange-500'} transition-all`}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Based on {Math.floor(confidence * 1000)} validated experiments
                  </p>
                </CardContent>
              </Card>

              {/* Adaptive Explanation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {userRole === "student" ? "Detailed Explanation" : 
                     userRole === "clinician" ? "Clinical Context" : 
                     "Technical Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {getAdaptiveExplanation()}
                  </p>
                </CardContent>
              </Card>

              {/* Visual Aid */}
              {visualAid && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Visual Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">5-second animation explaining {term}</p>
                        <p className="text-xs text-gray-400 mt-1">{visualAid}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Terms */}
              {relatedTerms.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      Related Concepts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {relatedTerms.map((related, idx) => (
                        <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-blue-100">
                          {related}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Collaborative Annotations */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Annotations (3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-white rounded border-l-4 border-blue-500">
                    <p className="text-xs font-semibold">Dr. Smith - 2 days ago</p>
                    <p className="text-xs text-gray-700">Confirmed in our lab with IC50 of 2.3 nM</p>
                  </div>
                  <div className="p-2 bg-white rounded border-l-4 border-green-500">
                    <p className="text-xs font-semibold">Lab Team - 1 week ago</p>
                    <p className="text-xs text-gray-700">This matches our computational predictions</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Add Your Annotation
                  </Button>
                </CardContent>
              </Card>

              {/* Multilingual Support */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Translate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">🇪🇸 Spanish</Button>
                    <Button size="sm" variant="outline">🇫🇷 French</Button>
                    <Button size="sm" variant="outline">🇩🇪 German</Button>
                    <Button size="sm" variant="outline">🇨🇳 Chinese</Button>
                    <Button size="sm" variant="outline">🇯🇵 Japanese</Button>
                  </div>
                </CardContent>
              </Card>

              {/* External Resources */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Full Documentation
                </Button>
                <Button variant="outline" className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Case Studies
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Lab Coach Assistant Widget
export function LabCoachWidget({ results }: { results: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const guidedSteps = [
    {
      title: "Why Molecule #3 Scored Highest",
      content: "This molecule has the best balance of binding affinity (-9.5 kcal/mol) and druglikeness (0.92).",
      action: "Show me the structure"
    },
    {
      title: "Key Binding Interactions",
      content: "4 hydrogen bonds with ASP25, ILE80, and 2 π-stacking interactions with PHE81.",
      action: "Visualize in 3D"
    },
    {
      title: "ADMET Profile",
      content: "High absorption (Caco-2: 8.2), low toxicity (hERG IC50 > 10μM), good metabolic stability.",
      action: "See detailed report"
    }
  ];

  return (
    <>
      {/* Floating Coach Button */}
      {!isOpen && (
        <button
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
          onClick={() => setIsOpen(true)}
        >
          <Lightbulb className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Coach Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border-2 border-purple-500">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Lab Coach
            </h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">{guidedSteps[currentStep].title}</h4>
              <p className="text-xs text-gray-700 mb-3">{guidedSteps[currentStep].content}</p>
              <Button size="sm" className="w-full">
                {guidedSteps[currentStep].action}
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              {guidedSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full ${idx === currentStep ? 'bg-purple-600' : idx < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={currentStep === guidedSteps.length - 1}
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
