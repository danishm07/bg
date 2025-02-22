import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, ArrowRight, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

function Home() {
  const [currentWord, setCurrentWord] = useState(0);
  const words = ['Study', 'Learn', 'Create', 'Share', 'Grow'];
  const colors = ['text-blue-500', 'text-green-500', 'text-orange-500', 'text-purple-500', 'text-pink-500'];
  
 


  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroTranslate = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  
  const featuresOpacity = useTransform(scrollYProgress, [0.2, 0.3, 0.6, 0.7], [0, 1, 1, 0]);
  const featuresTranslate = useTransform(scrollYProgress, [0.2, 0.3, 0.6, 0.7], [100, 0, 0, -100]);
  
  const ctaOpacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1]);
  const ctaTranslate = useTransform(scrollYProgress, [0.6, 0.7], [100, 0]);

  // Parallax and blur effects
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const featuresParallax = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const blurEffect = useTransform(scrollYProgress, [0, 0.5], [0, 8]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Study Together",
      description: "Transform your notes into interactive study materials.",
      link: "/study",
      color: "feature-blue"
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Real-time Chat",
      description: "Connect instantly with study partners and mentors.",
      link: "/chat-rooms",
      color: "feature-green"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Study Groups",
      description: "Find your perfect study group and collaborate effectively.",
      link: "/groups",
      color: "feature-purple"
    }
  ];

  return (
    <div className="home-container" ref={containerRef}>
      <motion.section 
        className="hero-section"
        style={{ 
          y: heroParallax,
          opacity: heroOpacity,
          backdropFilter: `blur(${blurEffect}px)`
        }}
      >
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="hero-title"
            variants={fadeInUp}
          >
            Where Students{' '}
            <span className="relative inline-block mx-3 min-w-[150px]">
              <span className={`word-rotate ${colors[currentWord]}`}>
                {words[currentWord] + " "}
              </span>
            </span>
            Together
          </motion.h1>
          <motion.p 
            className="hero-description"
            variants={fadeInUp}
          >
            Your digital study space for collaborative learning and knowledge sharing
          </motion.p>
          <motion.div 
            className="hero-buttons"
            variants={fadeInUp}
          >
            <Link to="/login" className="primary-button group">
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/groups" className="secondary-button">
              Browse Study Groups
            </Link>
          </motion.div>
        </motion.div>
        <div className="hero-background"></div>
      </motion.section>

      <motion.section 
        className="features-section"
        style={{ 
          y: featuresParallax,
          backdropFilter: `blur(${blurEffect}px)`,
          WebkitBackdropFilter: `blur(${blurEffect}px)`,
          

        }}
      >
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Sparkles className="inline-block mr-2 h-8 w-8 text-yellow-400" />
          Powerful Features for Better Learning
        </motion.h2>
        <motion.div 
          className="features-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
              }}
              whileTap={{ scale: 0.98 }}
              className={`feature-card ${feature.color}`}
            >
              <Link to={feature.link} className="feature-link group">
                <div className="feature-icon transition-transform group-hover:scale-110">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section 
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <motion.h2 
          className="cta-title"
          variants={fadeInUp}
        >
          Ready to Start Learning?
        </motion.h2>
        <motion.p 
          className="cta-description"
          variants={fadeInUp}
        >
          Join thousands of students already using our platform
        </motion.p>
        <motion.div variants={fadeInUp}>
          <Link to="/register" className="cta-button group">
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default Home;