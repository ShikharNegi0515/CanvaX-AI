import { motion } from 'framer-motion';
import { PenTool, Layout, Layers, Monitor, Sparkles, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function App() {
  const workspaces = [
    {
      title: "Design Studio",
      description: "Create professional designs, social media posts, and marketing materials.",
      icon: <Layers className="w-8 h-8 text-primary" />,
      color: "from-purple-500 to-primary",
    },
    {
      title: "Infinite Whiteboard",
      description: "Brainstorm, plan, and create complex diagrams on an endless canvas.",
      icon: <Users className="w-8 h-8 text-blue-500" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "UI/UX Designer",
      description: "Design and prototype beautiful web and mobile interfaces.",
      icon: <Layout className="w-8 h-8 text-secondary" />,
      color: "from-pink-500 to-secondary",
    },
    {
      title: "Drawing Studio",
      description: "Express your creativity with advanced digital art and illustration tools.",
      icon: <PenTool className="w-8 h-8 text-orange-500" />,
      color: "from-orange-500 to-red-500",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">CanvasX AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workspaces" className="hover:text-foreground transition-colors">Workspaces</a>
            <a href="#ai" className="hover:text-foreground transition-colors">AI Magic</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
            <Link to="/dashboard" className="bg-foreground text-background hover:bg-foreground/90 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>The All-in-One AI Design Platform</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Design, brainstorm, and create <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
              without limits.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            CanvasX AI combines Figma, Canva, Miro, and advanced AI into a single infinite canvas. 
            Experience the future of collaborative visual creation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-1">
              Start Designing Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-card hover:bg-accent text-foreground rounded-full font-medium text-lg border border-border flex items-center justify-center transition-all">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Workspaces Section */}
      <section id="workspaces" className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Four Workspaces. One Infinite Canvas.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Seamlessly switch between specialized tools designed for different creative needs, all sharing the same powerful foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspaces.map((workspace, index) => (
              <motion.div 
                key={workspace.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${workspace.color} opacity-5 blur-[80px] group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className="mb-6 inline-block p-4 rounded-2xl bg-accent">
                    {workspace.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{workspace.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {workspace.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Preview */}
      <section id="ai" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 md:p-20 rounded-[3rem] bg-foreground text-background relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <Sparkles className="w-12 h-12 mb-8 mx-auto text-primary" />
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">Powered by Advanced AI</h2>
              <p className="text-xl text-background/80 mb-10">
                Generate images, build complete UI layouts, design presentations, and create diagrams instantly using natural language prompts.
              </p>
              <button className="px-8 py-4 bg-primary text-white rounded-full font-medium text-lg shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-1">
                Explore AI Features
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border text-center text-muted-foreground">
        <p>© 2026 CanvasX AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
