import { motion } from "motion/react";
import { GlassCard } from "../components/GlassCard";
import { Wallet, QrCode, Shield, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface WalletWizardScreenProps {
  onComplete: () => void;
}

export function WalletWizardScreen({ onComplete }: WalletWizardScreenProps) {
  const [connected, setConnected] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleConnect = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setConnected(true);
      setTimeout(onComplete, 1500);
    }, 2000);
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GlassCard className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center">
          {!connected ? (
            <>
              <motion.div
                className="p-6 rounded-full mb-6"
                style={{
                  background: "var(--accent)",
                  border: "2px solid var(--primary)",
                }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wallet className="w-12 h-12" style={{ color: "var(--primary)" }} />
              </motion.div>

              <h2 className="mb-2" style={{ color: "var(--foreground)" }}>
                Connect Your Wallet
              </h2>
              <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
                Securely connect to start your odyssey
              </p>

              <div className="w-full space-y-4">
                <button
                  onClick={handleConnect}
                  disabled={verifying}
                  className="w-full px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
                    color: "white",
                  }}
                >
                  {verifying ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      WalletConnect
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4" style={{ color: "var(--chart-3)" }} />
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Bank-grade encryption
                  </span>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="p-6 rounded-full mb-6"
                style={{
                  background: "var(--chart-3)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(45, 212, 191, 0.4)",
                    "0 0 40px rgba(45, 212, 191, 0.8)",
                    "0 0 20px rgba(45, 212, 191, 0.4)",
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h2 style={{ color: "var(--foreground)" }}>Trust Verified!</h2>
              <p style={{ color: "var(--muted-foreground)" }}>Launching your odyssey...</p>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
