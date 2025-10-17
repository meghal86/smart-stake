import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFeedback("");
      setSubmitted(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--chart-2))",
          color: "white",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        animate={{
          boxShadow: [
            "0 4px 20px rgba(8, 145, 178, 0.4)",
            "0 4px 30px rgba(107, 95, 255, 0.6)",
            "0 4px 20px rgba(8, 145, 178, 0.4)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-80"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <GlassCard className="p-6">
              <h3 className="mb-4" style={{ color: "var(--foreground)" }}>
                Share Your Feedback
              </h3>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="w-full h-32 p-3 rounded-lg resize-none"
                    style={{
                      background: "var(--input-background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--chart-3))",
                      color: "white",
                    }}
                  >
                    Send Feedback
                  </button>
                </form>
              ) : (
                <motion.div
                  className="text-center py-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <p style={{ color: "var(--foreground)" }}>Thank you for your feedback!</p>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
