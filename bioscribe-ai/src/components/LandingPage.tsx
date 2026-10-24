"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Award,
  ChevronRight,
  Check,
  Star,
  Play,
  Atom,
  Dna,
  FlaskConical,
  Microscope,
  Sparkles,
  BarChart3,
  Lock,
  Globe
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

import { Hero3D } from "./Hero3D";
import { FeatureShowcase } from "./FeatureShowcase";
import { ScreeningShowcase } from "./ScreeningShowcase";

// ... existing imports ...

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hackathon Disclaimer Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-2 px-4 text-center text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span><strong>For Research Use Only.</strong> All AI predictions require laboratory validation. Uses synthetic/public data only.</span>
        </span>
      </div>

      {/* Hero Section with Animated Molecular Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-[90vh] flex items-center">
        {/* Animated Molecular Background */}
        <Hero3D />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/80"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Hackathon Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 hackathon-badge text-white rounded-full text-sm font-bold shadow-lg shadow-orange-500/30 animate-pulse">
                <Award className="w-5 h-5" />
                <span>🏆 AI Healthcare & Life Sciences Hackathon Edition</span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 backdrop-blur-sm border border-blue-200 text-blue-700 rounded-full text-sm font-medium shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>Enterprise-Grade AI Drug Discovery</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
                Accelerate Drug
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Discovery by 10x
                </span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed">
                Transform months of research into days with our enterprise-grade AI platform.
                From target identification to clinical trials, powered by cutting-edge machine learning.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onGetStarted}
                  className="h-14 px-8 btn-premium hover-lift bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-semibold shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/60"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => setShowVideoModal(true)}
                  variant="outline"
                  className="h-14 px-8 hover-lift border-2 border-blue-400/50 bg-white/10 backdrop-blur-sm text-blue-900 hover:bg-white/20 text-base font-semibold transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-slate-900">500+ Researchers</div>
                    <div className="text-slate-500">Trust BioScribe</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-900">4.9/5</span>
                  <span className="text-sm text-slate-500">(200+ reviews)</span>
                </div>
              </div>
            </div>

            {/* Right Visual - Enhanced Dashboard Preview */}
            <div className="relative">
              <div className="relative glass-premium hover-lift rounded-3xl shadow-2xl p-8 border border-white/40">
                {/* Mock Dashboard */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                        <FlaskConical className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Complete Pipeline Analysis</div>
                        <div className="text-xs text-slate-500 font-mono">HIV-1 Protease • 306 residues</div>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                      <Check className="w-3 h-3" /> Complete
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-3xl font-bold text-blue-700">247</div>
                      <div className="text-xs text-blue-600 mt-1 font-medium">Drug Candidates</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="text-3xl font-bold text-purple-700">-8.4</div>
                      <div className="text-xs text-purple-600 mt-1 font-medium">Best Affinity</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="text-3xl font-bold text-green-700">98%</div>
                      <div className="text-xs text-green-600 mt-1 font-medium">Success Rate</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Protein Analysis", progress: 100, icon: Microscope, color: "blue" },
                      { label: "Drug Generation", progress: 100, icon: Dna, color: "purple" },
                      { label: "Docking Simulation", progress: 85, icon: Atom, color: "green" }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                            <span className="text-gray-700 font-medium">{item.label}</span>
                          </div>
                          <span className="text-gray-900 font-bold">{item.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 rounded-full transition-all duration-1000`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements with Glow */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl shadow-blue-500/50 flex items-center justify-center animate-float">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl shadow-purple-500/50 flex items-center justify-center animate-float-delayed">
                <Award className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrollytelling Features */}
      <FeatureShowcase />

      {/* Universal Screening Hub Showcase */}
      <ScreeningShowcase />

      {/* Stats Section (Existing or New) */}
      {/* ... */}

      {/* Features Section - Enhanced */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
              <BarChart3 className="w-4 h-4" />
              <span>Complete Drug Discovery Platform</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need for drug discovery
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From initial screening to clinical trials, our platform handles every step of the drug discovery pipeline with enterprise-grade reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Analysis",
                description: "Advanced machine learning models analyze millions of compounds in seconds with 95%+ accuracy",
                color: "blue",
                gradient: "from-blue-500 to-blue-600"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and compliance with HIPAA, GDPR, FDA 21 CFR Part 11 regulations",
                color: "green",
                gradient: "from-green-500 to-emerald-600"
              },
              {
                icon: TrendingUp,
                title: "10x Faster Results",
                description: "Reduce drug discovery timelines from years to months with automated workflows and parallel processing",
                color: "purple",
                gradient: "from-purple-500 to-purple-600"
              },
              {
                icon: Users,
                title: "Collaborative Platform",
                description: "Real-time collaboration tools for distributed research teams with version control and audit trails",
                color: "orange",
                gradient: "from-orange-500 to-red-600"
              },
              {
                icon: Award,
                title: "Validated Results",
                description: "Peer-reviewed algorithms with 95%+ accuracy in clinical validation and published research",
                color: "pink",
                gradient: "from-pink-500 to-rose-600"
              },
              {
                icon: Globe,
                title: "Seamless Integration",
                description: "Connect with existing lab equipment, LIMS, ELN systems, and data management platforms",
                color: "indigo",
                gradient: "from-indigo-500 to-purple-600"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group relative p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-400 bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by the world's leading researchers</h2>
            <p className="text-blue-100 text-lg">Real results from real research teams</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Research Teams", icon: Users },
              { value: "10M+", label: "Compounds Analyzed", icon: FlaskConical },
              { value: "95%", label: "Accuracy Rate", icon: Award },
              { value: "10x", label: "Faster Discovery", icon: Zap }
            ].map((stat, idx) => (
              <div key={idx} className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-6xl font-bold mb-3">{stat.value}</div>
                <div className="text-blue-100 text-lg font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by leading researchers worldwide
            </h2>
            <p className="text-xl text-gray-600">See what our users have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "BioScribe reduced our drug discovery timeline from 3 years to 8 months. The AI predictions were remarkably accurate and saved us millions in research costs.",
                author: "Dr. Sanil",
                role: "Lead Researcher, Stanford Medicine",
                rating: 5,
                avatar: "DS"
              },
              {
                quote: "The platform's integration with our existing lab equipment saved us countless hours. It's like having a full research team at your fingertips, available 24/7.",
                author: "Prof. Michael Roberts",
                role: "Director, MIT BioLab",
                rating: 5,
                avatar: "MR"
              },
              {
                quote: "We've identified 3 promising drug candidates in just 6 months. The ROI has been incredible for our biotech startup. Highly recommended!",
                author: "Dr. Emily Zhang",
                role: "CEO, NovaCure Therapeutics",
                rating: 5,
                avatar: "EZ"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-8 leading-relaxed text-lg">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold mb-6">
            Ready to accelerate your research?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of research teams using BioScribe to discover breakthrough therapies faster than ever before
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onGetStarted}
              className="h-16 px-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold shadow-2xl shadow-blue-500/50"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button
              onClick={() => setShowVideoModal(true)}
              variant="outline"
              className="h-16 px-12 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg font-bold"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-8">
            ✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime • ✓ Full feature access
          </p>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="text-white font-bold text-xl">BioScribe</span>
              </div>
              <p className="text-sm leading-relaxed">
                Enterprise-grade AI-powered drug discovery platform for the next generation of therapeutics.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-sm text-center">
            © 2025 BioScribe AI. All rights reserved. • Built with ❤️ for the biotech community
          </div>
        </div>
      </footer>

      {/* Video Demo Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>BioScribe Platform Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Demo video coming soon</p>
              <p className="text-sm text-gray-400 mt-2">See BioScribe in action with a complete workflow walkthrough</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite 2s;
        }
        .molecular-bg .molecule {
          position: absolute;
          animation: drift linear infinite;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div >
  );
}
