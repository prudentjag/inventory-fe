import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Zap, Store } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-black/20 absolute w-full border-none">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              IM
            </div>
            <span className="font-bold text-xl tracking-tight text-white drop-shadow-md">
              InvManager
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-200 hover:text-white transition-colors drop-shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero-bg.png"
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 z-10"></div>
          </div>

          <div className="container mx-auto px-6 text-center relative z-20 pt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              v1.0 Now Live
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white drop-shadow-xl">
              Multi-Unit Inventory <br className="hidden md:block" />
              <span className="text-white/90">Management Simplified.</span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto mb-12 leading-relaxed font-light drop-shadow-md">
              Control your Bar, Club, and Supermarket operations from a single
              centralized dashboard. Track sales, manage staff, and monitor
              inventory in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Launch Portal
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold transition-all backdrop-blur-sm shadow-lg">
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-secondary/20 border-t border-border/50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">
              Why Choose InvManager?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Store className="text-blue-500" size={32} />}
                title="Multi-Unit Support"
                description="Manage distinct inventories for your Bar, Kitchen, and Mart with strict data isolation."
              />
              <FeatureCard
                icon={<ShieldCheck className="text-green-500" size={32} />}
                title="Role-Based Security"
                description="Granular access controls ensure staff only access resources within their assigned unit."
              />
              <FeatureCard
                icon={<BarChart3 className="text-purple-500" size={32} />}
                title="Real-Time Analytics"
                description="Instant visibility into daily sales, stock levels, and staff performance across all units."
              />
              <FeatureCard
                icon={<Zap className="text-yellow-500" size={32} />}
                title="Lightning Fast POS"
                description="Optimized checkout experience suitable for high-paced environments like Clubs."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            © 2024 Inventory Manager System. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
