import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Brain, Zap, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AITradingNav: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Market Analysis",
      description: "Get intelligent insights on market trends and patterns",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Live Market Charts",
      description: "Interactive charts with EODHD data",
    },
    {
      icon: <Newspaper className="h-6 w-6" />,
      title: "Real-time News",
      description: "Stay updated with market-moving news",
    },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-slate-800/50 to-purple-800/50 border-slate-700">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="h-8 w-8 text-blue-400" />
          <CardTitle className="text-2xl text-white">
            AI Trading Assistant
          </CardTitle>
        </div>
        <CardDescription className="text-gray-300 text-lg">
          Your intelligent companion for market analysis and trading strategies
        </CardDescription>
        <Badge variant="secondary" className="mt-2 bg-blue-600 text-white">
          Powered by GPT-4
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-slate-700/50 rounded-lg text-blue-400">
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={() => navigate("/ai-trading")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
          >
            <Bot className="h-5 w-5 mr-2" />
            Launch AI Trading Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITradingNav;
