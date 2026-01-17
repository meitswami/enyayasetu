import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Scale, FileText, Sparkles, Gavel, IndianRupee, TrendingUp, BookOpen } from "lucide-react";
import logo from "@/assets/logo.png";

interface HeroSectionProps {
  onSelectExampleCases: () => void;
  onSelectCustomCase: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectExampleCases, onSelectCustomCase }) => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">⚖️</div>
      <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: "1s" }}>
        📜
      </div>
      <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float" style={{ animationDelay: "2s" }}>
        🔨
      </div>
      <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-float" style={{ animationDelay: "0.5s" }}>
        👨‍⚖️
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-6">
          <img src={logo} alt="eNyayaSetu Logo" className="w-48 md:w-64 lg:w-72 mx-auto" />
        </div>

        {/* Main title */}
        <h1 className="font-bangers text-5xl md:text-7xl lg:text-8xl text-foreground mb-2 leading-none">
          <span className="text-primary">eNyaya</span>
          <span className="text-secondary">Setu</span>
        </h1>

        {/* Slogan */}
        <p className="text-lg md:text-xl text-primary font-bold uppercase tracking-widest mb-6">
          Digital Bridge of Justice
        </p>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-comic">
          Experience virtual court hearings powered by AI. Real participants interact while AI judges and lawyers process cases based on Indian Laws.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: Scale, text: "AI-Powered Analysis" },
            { icon: Gavel, text: "Indian Laws & Acts" },
            { icon: FileText, text: "OCR & Evidence Analysis" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-foreground bg-card shadow-[2px_2px_0_hsl(var(--foreground))]"
            >
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="comic" size="xl" onClick={onSelectExampleCases} className="group">
            <FileText className="w-5 h-5 group-hover:animate-shake" />
            EXAMPLE CASES
          </Button>

          <Button variant="prosecutor" size="xl" onClick={onSelectCustomCase} className="group">
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
            FILE NEW CASE
          </Button>
        </div>

        {/* Pricing Link */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate('/pricing')}
            className="group"
          >
            <IndianRupee className="w-4 h-4 mr-2" />
            View Pricing & Plans
          </Button>
        </div>

        {/* NEW FEATURES - Prominently Highlighted */}
        <div className="mt-12 w-full max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="font-bangers text-3xl md:text-4xl text-foreground mb-2">
              ✨ NEW FEATURES ✨
            </h2>
            <p className="text-muted-foreground">Powerful tools to strengthen your case and exercise your rights</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Case Strength Analysis Feature */}
            <div 
              className="relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border-4 border-foreground shadow-[6px_6px_0_hsl(var(--foreground))] p-6 transform hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="absolute top-2 right-2">
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bangers text-2xl text-foreground mb-2">Case Strength Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered analysis of your case strength based on uploaded documents. Know your case's strength percentage instantly!
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        200 for suggestions
                      </Badge>
                      <span className="text-xs text-muted-foreground">Analysis: FREE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RTI Tutorial Feature */}
            <div className="relative bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-2xl border-4 border-foreground shadow-[6px_6px_0_hsl(var(--foreground))] p-6 transform hover:scale-105 transition-transform">
              <div className="absolute top-2 right-2">
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bangers text-2xl text-foreground mb-2">RTI Tutorial & Application</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete guided tutorial on Right to Information Act. Learn how to apply for RTI and apply directly from here!
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800">
                      <IndianRupee className="w-3 h-3 mr-1" />
                      50 Only
                    </Badge>
                    <Button 
                      variant="comic" 
                      size="sm"
                      onClick={() => navigate('/rti')}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comic-style action text */}
        <div className="mt-12 relative">
          <div className="inline-block px-8 py-4 bg-secondary rounded-2xl border-4 border-foreground shadow-[6px_6px_0_hsl(var(--foreground))] transform -rotate-2">
            <p className="font-bangers text-2xl md:text-3xl text-secondary-foreground">🎬 JUSTICE AWAITS! 🎬</p>
          </div>
        </div>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/50 to-transparent" />
    </section>
  );
};
