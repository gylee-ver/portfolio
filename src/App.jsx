import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, ChevronDown, ExternalLink, Award, TrendingUp, Users, Target, Mail, Phone, X, MapPin } from 'lucide-react';

// --- PARTICLE SYSTEM ---

const ParticleHero = () => {

  const canvasRef = useRef(null);

  const [isAssembled, setIsAssembled] = useState(false);

  const requestRef = useRef(null);

  const mouseRef = useRef({ x: null, y: null, radius: 120 });

  

  // 파티클 상태 관리

  const particlesRef = useRef([]);

  useEffect(() => {

    const canvas = canvasRef.current;

    const ctx = canvas.getContext('2d');

    

    // 캔버스 크기 설정

    const handleResize = () => {

      // 브라우저 환경 체크 및 유효성 검사

      if (typeof window === 'undefined' || !canvas) return;

      

      canvas.width = window.innerWidth;

      canvas.height = window.innerHeight;

      

      // 너비나 높이가 0이면 그리기 중단 (IndexSizeError 방지)

      if (canvas.width === 0 || canvas.height === 0) return;

      

      initParticles();

    };

    // 텍스트를 캔버스에 그려서 픽셀 데이터 추출 (Target Coordinates 생성)

    const initParticles = () => {

      if (!canvas || canvas.width === 0 || canvas.height === 0) return;

      particlesRef.current = [];

      

      // 1. 임시 캔버스에 텍스트 그리기

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fontSize = window.innerWidth < 768 ? 150 : window.innerWidth * 0.25;

      ctx.font = `bold ${fontSize}px "Inter", sans-serif`;

      ctx.fillStyle = 'white';

      ctx.textAlign = 'center';

      ctx.textBaseline = 'middle';

      

      const text = "LGY";

      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      

      // 2. 픽셀 데이터 분석

      const gap = window.innerWidth < 768 ? 4 : 5; 

      const textCoordinates = [];

      

      try {

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

        

        for (let y = 0; y < canvas.height; y += gap) {

            for (let x = 0; x < canvas.width; x += gap) {

            const alpha = data.data[(y * 4 * data.width) + (x * 4) + 3];

            if (alpha > 128) {

                textCoordinates.push({ x, y });

            }

            }

        }

      } catch (e) {

        console.error("Failed to get image data:", e);

        return; // 오류 발생 시 중단

      }

      // 3. 파티클 생성

      // 텍스트 파티클

      textCoordinates.forEach((coord) => {

        particlesRef.current.push(new Particle(coord.x, coord.y, canvas));

      });

      

      // 배경 파티클

      const bgParticleCount = window.innerWidth < 768 ? 50 : 120;

      for(let i=0; i<bgParticleCount; i++){

         particlesRef.current.push(new Particle(Math.random()*canvas.width, Math.random()*canvas.height, canvas, true));

      }

    };

    // 파티클 클래스

    class Particle {

      constructor(targetX, targetY, canvas, isBackground = false) {

        this.canvas = canvas;

        this.targetX = targetX; // LGY 글자 위치

        this.targetY = targetY;

        

        // Origin 위치 (무질서 상태일 때 돌아갈 위치)

        this.originX = Math.random() * canvas.width;

        this.originY = Math.random() * canvas.height;

        // 초기 위치 (무질서 상태에서 시작)

        this.x = this.originX;

        this.y = this.originY;

        

        // 속도

        this.vx = 0;

        this.vy = 0;

        

        // 크기 및 색상

        this.size = isBackground ? Math.random() * 1.5 + 0.5 : Math.random() * 2 + 1.5;

        this.baseColor = isBackground ? 'rgba(212, 255, 0, 0.15)' : 'rgba(212, 255, 0, 0.9)'; 

        this.isBackground = isBackground;

      }

      update(mouse, assembled) {

        // 1. Mouse Interaction (Repulsion - 부드럽게 밀어내기)

        if (mouse.x != null && mouse.y != null) {

            const dx = mouse.x - this.x;

            const dy = mouse.y - this.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            

            if (distance < mouse.radius) {

                const forceDirectionX = dx / distance;

                const forceDirectionY = dy / distance;

                const force = (mouse.radius - distance) / mouse.radius;

                

                const pushStrength = this.isBackground ? 2 : 5;

                const directionX = forceDirectionX * force * pushStrength; 

                const directionY = forceDirectionY * force * pushStrength;

                this.vx -= directionX;

                this.vy -= directionY;

            }

        }

        // 2. Movement Logic

        let destX, destY;

        

        if (assembled && !this.isBackground) {

            // [Structure Mode] 목표 지점(글자)으로 이동

            destX = this.targetX;

            destY = this.targetY;

            

            // 스프링 효과 (빠르고 단단하게)

            this.vx += (destX - this.x) * 0.04;

            this.vy += (destY - this.y) * 0.04;

            

            // 강한 마찰력 (딱 멈추는 느낌)

            this.vx *= 0.85; 

            this.vy *= 0.85;

        } else {

            // [Chaos Mode] 본래의 랜덤 위치로 복귀 (점진적 무질서)

            if (!this.isBackground) {

                destX = this.originX;

                destY = this.originY;

                

                // 아주 약한 힘으로 당김 (서서히 흩어지는 느낌)

                this.vx += (destX - this.x) * 0.005;

                this.vy += (destY - this.y) * 0.005;

                

                // 약간의 랜덤성(Brownian) 추가하여 너무 기계적으로 움직이지 않게 함

                this.vx += (Math.random() - 0.5) * 0.05;

                this.vy += (Math.random() - 0.5) * 0.05;

                // 마찰력 (부드럽게 유영)

                this.vx *= 0.95;

                this.vy *= 0.95;

            } else {

                // 배경 파티클은 계속 부유

                this.vx += (Math.random() - 0.5) * 0.02;

                this.vy += (Math.random() - 0.5) * 0.02;

                this.vx *= 0.99;

                this.vy *= 0.99;

                // 화면 경계 처리

                if (this.x < 0 || this.x > this.canvas.width) this.vx = -this.vx;

                if (this.y < 0 || this.y > this.canvas.height) this.vy = -this.vy;

            }

        }

        // 위치 업데이트

        this.x += this.vx;

        this.y += this.vy;

      }

      draw(ctx) {

        ctx.fillStyle = this.baseColor;

        ctx.beginPath();

        ctx.rect(this.x, this.y, this.size, this.size);

        ctx.fill();

      }

    }

    // 애니메이션 루프

    const animate = () => {

      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      

      particlesRef.current.forEach(particle => {

        particle.update(mouseRef.current, isAssembled);

        particle.draw(ctx);

      });

      requestRef.current = requestAnimationFrame(animate);

    };

    handleResize();

    window.addEventListener('resize', handleResize);

    animate();

    const handleMouseMove = (e) => {

        const rect = canvas.getBoundingClientRect();

        mouseRef.current.x = e.clientX - rect.left;

        mouseRef.current.y = e.clientY - rect.top;

    };

    

    const handleMouseLeave = () => {

        mouseRef.current.x = null;

        mouseRef.current.y = null;

    };

    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('mouseout', handleMouseLeave);

    return () => {

      window.removeEventListener('resize', handleResize);

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseout', handleMouseLeave);

      if (requestRef.current) cancelAnimationFrame(requestRef.current);

    };

  }, [isAssembled]);

  // 스크롤 이벤트 (조립/해제 트리거)

  useEffect(() => {

    const handleScroll = () => {

        // 스크롤 감도 조절

        if (window.scrollY > 80) { 

            setIsAssembled(true);

        } else {

            setIsAssembled(false);

        }

    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);

  return (

    <canvas 

        ref={canvasRef} 

        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"

    />

  );

};

// --- DATA ---

const PROJECTS = [

  {

    id: 1,

    category: "AWARD & PROBLEM SOLVING",

    title: "카카오 임팩트 챌린지 대상",

    subtitle: "현장의 목소리로 안산시 스쿨존 안전 문제를 재정의하다",

    description: "책상 위 가설을 버리고 현장에서 답을 찾았습니다. '불법 주차가 아이들의 시야를 가린다'는 핵심 원인을 발견하고, 새로운 디자인 솔루션을 제안하여 심사위원 만장일치 대상을 수상했습니다.",

    detailDescription: "단순히 '스쿨존 사고가 많다'는 문제에서 출발하지 않았습니다. 3단계 리서치(데스크-현장-인터뷰)를 통해 안산시 다세대 주택 밀집 지역의 '불법 주차'가 아이들의 시야를 차단하는 근본 원인임을 밝혀냈습니다. 이를 해결하기 위해 기존의 고정형 안전 시설물이 아닌, 아이들의 눈높이에 맞춘 시야 확보 솔루션을 프로토타입으로 제작했습니다. 이 프로젝트는 '문제 정의의 깊이가 솔루션의 퀄리티를 결정한다'는 제 철학을 증명한 사례입니다.",

    tags: ['Design Thinking', 'Field Research', 'UX/UI', 'Team Leadership'],

    stats: [

      { label: 'Result', value: 'Grand Prize' },

      { label: 'Role', value: 'Team Lead' },

      { label: 'Period', value: '2025.07' }

    ],

    image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop"

  },

  {

    id: 2,

    category: "AI & SOCIAL IMPACT",

    title: "2025 AI 융합 아이디어톤 대상",

    subtitle: "데이터로 고령화와 제조 인력난의 교차점을 찾다",

    description: "안산시의 베이비붐 세대 은퇴와 제조업 인력난을 별개의 문제가 아닌 하나의 구조적 기회로 해석했습니다. 은퇴 시니어와 공장을 연결하는 AI 매칭 플랫폼을 기획했습니다.",

    detailDescription: "베이비붐 세대의 은퇴로 인한 숙련공 소멸과 중소 제조기업의 인력난이 동시에 발생하는 현상에 주목했습니다. '은퇴했지만 여전히 일할 수 있는 숙련 기술자'와 '사람이 필요한 공장'을 연결하는 것이 핵심이었습니다. 단순 매칭이 아닌, AI 기반의 태스크 매칭 시스템을 기획하여 실현 가능한 비즈니스 모델로 구체화했습니다. 기술보다 중요한 것은 '왜 이 기술이 필요한가'에 대한 명확한 문제 정의임을 입증했습니다.",

    tags: ['Data Analysis', 'Business Modeling', 'AI Planning', 'Grand Prize'],

    stats: [

      { label: 'Result', value: 'Target Defined' },

      { label: 'Tech', value: 'AI Matching' },

      { label: 'Period', value: '2025.11' }

    ],

    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"

  },

  {

    id: 3,

    category: "GROWTH MARKETING",

    title: "4050 패션 플랫폼 '애슬러'",

    subtitle: "고객의 언어를 '패션'에서 '골프 라이프스타일'로 바꾸다",

    description: "높은 유료 광고 의존도 문제를 해결하기 위해 타겟 고객의 진짜 관심사인 '골프'로 콘텐츠 축을 옮겼습니다. 비용 투입 없이 매출을 만드는 성장 엔진을 구축했습니다.",

    detailDescription: "DAU 하락과 높은 CAC 문제를 해결하기 위해 고객 인터뷰와 데이터 분석을 진행했습니다. 4050 남성 타겟이 단순히 옷을 사는 것이 아니라, '골프'라는 라이프스타일을 소비한다는 점을 발견했습니다. 이를 바탕으로 골프 테마의 숏폼 콘텐츠와 커뮤니티 전략을 실행했습니다. 결과적으로 오가닉 유입만으로 140명의 구매 전환을 만들어냈고, 마케팅 비용을 획기적으로 절감하며 지속 가능한 성장 구조를 만들었습니다.",

    tags: ['Growth Hacking', 'Content Strategy', 'Zero Cost Marketing', 'Pivot'],

    stats: [

      { label: 'CAC Reduction', value: '-25%' },

      { label: 'Organic Conv.', value: '140 Users' },

      { label: 'Period', value: '2024.04 - 06' }

    ],

    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070&auto=format&fit=crop"

  },

  {

    id: 4,

    category: "O2O PLATFORM MARKETING",

    title: "홈서비스 플랫폼 '열다'",

    subtitle: "신뢰를 잃은 시장에서 '검증된 후기'로 승부하다",

    description: "활성 고객 정체를 해결하기 위해 SQL 코호트 분석을 수행했습니다. '2회 이상 이용 고객'이 신뢰를 중시한다는 점을 발견, 신뢰 여정(Trust Journey)을 설계했습니다.",

    detailDescription: "서비스 재사용률이 정체되는 원인을 찾기 위해 SQL로 유저 행동 데이터를 뜯어보았습니다. 핵심 퍼소나는 '신도시 맞벌이 부부'였고, 이들이 가장 중요하게 생각하는 것은 '검증된 신뢰'였습니다. 이에 맞춰 블로그 체험단과 상세 페이지의 비포&애프터 콘텐츠를 전면 개편하여 '검색하면 무조건 신뢰할 수 있는 정보가 나오도록' 퍼널을 설계했습니다. 그 결과 마케팅 효율을 최적화하고 CAC를 40%나 줄이는 성과를 거두었습니다.",

    tags: ['Data Analysis', 'SQL & GA4', 'Funnel Optimization', 'Retention'],

    stats: [

      { label: 'CAC Reduction', value: '-40%' },

      { label: 'Strategy', value: 'Trust Funnel' },

      { label: 'Period', value: '2024.09 - 2025.02' }

    ],

    image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2070&auto=format&fit=crop"

  }

];

const HISTORY = [

  { year: "2025", title: "파이오닉스랩 공동창업", desc: "Growth Marketing Lead. 스타트업 클라이언트 성장 전략 수립.", type: "career" },

  { year: "2025", title: "카카오 임팩트 챌린지 & AI 아이디어톤 대상", desc: "사회 문제 해결을 위한 기술/기획 역량 입증.", type: "award" },

  { year: "2024", title: "플랫폼 '열다' & '애슬러'", desc: "Marketing Lead & Growth Marketer. 데이터 기반 성장 견인.", type: "career" },

  { year: "2023", title: "JB ORCA 야구단 창단", desc: "Founder. 0에서 27명의 조직을 구축하고 브랜딩.", type: "milestone" },

  { year: "2023", title: "스포츠 저널리즘 & 해설", desc: "네이버 스포츠 연재, K3리그 해설위원. 현장의 언어를 콘텐츠로.", type: "career" },

  { year: "2019", title: "한양대학교 미디어학과", desc: "커뮤니케이션과 미디어 생태계에 대한 학문적 탐구.", type: "education" },

  { year: "2018", title: "Start of the Journey", desc: "동아방송예술대학교 뉴미디어콘텐츠과 입학.", type: "education" }

];

// --- COMPONENTS ---

const App = () => {

  const [selectedProject, setSelectedProject] = useState(null);

  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {

    stiffness: 100,

    damping: 30,

    restDelta: 0.001

  });

  useEffect(() => {

    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);

  const scrollToSection = (id) => {

    const element = document.getElementById(id);

    if (element) {

      element.scrollIntoView({ behavior: 'smooth' });

    }

  };

  return (

    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#d4ff00] selection:text-black overflow-x-hidden">

      

      {/* Scroll Progress Bar */}

      <motion.div

        className="fixed top-0 left-0 right-0 h-1 bg-[#d4ff00] origin-left z-50 mix-blend-difference"

        style={{ scaleX }}

      />

      {/* Navigation */}

      <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-[#050505]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          <motion.div 

            initial={{ opacity: 0, x: -20 }}

            animate={{ opacity: 1, x: 0 }}

            className="text-2xl font-bold tracking-tighter cursor-pointer"

            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}

          >

            LGY<span className="text-[#d4ff00]">.</span>

          </motion.div>

          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">

            {['Philosophy', 'History', 'Projects', 'ZeroToOne', 'Contact'].map((item) => (

              <button 

                key={item}

                onClick={() => scrollToSection(item.toLowerCase())}

                className="hover:text-[#d4ff00] transition-colors uppercase tracking-widest text-xs"

              >

                {item === 'ZeroToOne' ? 'Zero to One' : item}

              </button>

            ))}

          </div>

        </div>

      </nav>

      {/* Hero Section */}

      <section id="hero" className="relative h-screen flex flex-col justify-center px-6 overflow-hidden bg-[#050505]">

        {/* Particle Canvas Layer */}

        <ParticleHero />

        

        {/* Content Overlay */}

        <div className="max-w-7xl mx-auto w-full z-10 relative pointer-events-none">

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={{ duration: 1, delay: 1 }} // 파티클이 모인 후 나타나도록 딜레이

          >

            <div className="flex items-center gap-3 mb-6">

              <span className="h-[1px] w-12 bg-[#d4ff00]"></span>

              <h2 className="text-[#d4ff00] font-mono text-sm tracking-[0.2em] uppercase">

                Growth Marketer & Strategist

              </h2>

            </div>

          

            <h1 className="text-5xl md:text-8xl font-bold leading-[1.1] mb-8 tracking-tight text-white/90">

                RE<span className="text-[#d4ff00]">:</span>DEFINE<br />

                THE PROBLEM.

            </h1>

            <p className="text-gray-400 text-lg md:text-2xl max-w-2xl font-light leading-relaxed mb-12">

               책상을 버리고 현장으로, 가설을 넘어서 확신으로.<br/>

               <span className="text-white font-medium">본질을 꿰뚫는 정의가 압도적인 성장을 만듭니다.</span>

            </p>

            <div className="pointer-events-auto inline-block">

                <button

                    onClick={() => scrollToSection('projects')}

                    className="group flex items-center gap-4 text-white px-8 py-4 border border-white/20 rounded-full hover:border-[#d4ff00] hover:bg-[#d4ff00]/10 transition-all duration-300 bg-black/50 backdrop-blur-md"

                >

                    <span className="text-sm tracking-widest uppercase font-bold">View My Hustle</span>

                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                </button>

            </div>

          </motion.div>

        </div>

        <motion.div 

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ delay: 2, duration: 1 }}

          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 animate-bounce pointer-events-none"

        >

          <span className="text-xs mb-2 block text-center font-mono opacity-50">SCROLL TO ASSEMBLE</span>

          <ChevronDown className="w-6 h-6 mx-auto" />

        </motion.div>

      </section>

      {/* Philosophy Section */}

      <section id="philosophy" className="py-32 px-6 bg-[#0a0a0a]">

        <div className="max-w-7xl mx-auto">

          <div className="grid md:grid-cols-2 gap-20 items-start">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true, margin: "-100px" }}

              transition={{ duration: 0.6 }}

            >

              <h3 className="text-4xl md:text-5xl font-bold mb-10 leading-tight">

                진짜 문제는 <br/>

                <span className="text-[#d4ff00] italic">책상 위</span>에<br/> 

                있지 않습니다.

              </h3>

              <div className="space-y-6 text-gray-400 leading-relaxed text-lg">

                <p>

                  <strong className="text-white">3개월 140명 0원. 고객 획득 비용 40% 절감.</strong><br/>

                  이 모든 숫자는 화려한 툴이 아닌, 고객의 목소리가 들리는 현장에서 시작되었습니다.

                </p>

                <p>

                  저는 데이터 뒤에 숨겨진 사람(Context)을 읽습니다.

                  단순히 "트래픽을 늘리자"가 아닌, "고객이 왜 이탈하는가?"를 집요하게 파고듭니다.

                  마케터이자 기획자, 그리고 창업가로서 저는 언제나 0에서 1을 만드는 최전선에 서 있습니다.

                </p>

              </div>

            </motion.div>

            

            <div className="grid grid-cols-2 gap-5">

              {[

                { Icon: Target, title: "Definition", desc: "본질적 문제 정의" },

                { Icon: TrendingUp, title: "Impact", desc: "수치로 증명하는 성장" },

                { Icon: Users, title: "Field", desc: "현장 중심 리서치" },

                { Icon: Award, title: "Hustle", desc: "끝까지 해내는 집요함" }

              ].map(({ Icon, ...item }, idx) => (

                <motion.div 

                  key={idx}

                  initial={{ opacity: 0, y: 20 }}

                  whileInView={{ opacity: 1, y: 0 }}

                  viewport={{ once: true }}

                  transition={{ delay: idx * 0.1 }}

                  whileHover={{ y: -5, borderColor: "rgba(212, 255, 0, 0.5)" }}

                  className="bg-[#111] p-8 border border-white/5 transition-all rounded-xl flex flex-col justify-between h-48 group"

                >

                  <div className="text-[#d4ff00] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">

                    <Icon size={32} />

                  </div>

                  <div>

                    <h4 className="font-bold text-xl mb-1">{item.title}</h4>

                    <p className="text-sm text-gray-500">{item.desc}</p>

                  </div>

                </motion.div>

              ))}

            </div>

          </div>

        </div>

      </section>

      {/* History (Timeline) Section */}

      <section id="history" className="py-32 px-6 bg-[#050505] relative">

        <div className="max-w-4xl mx-auto">

          <motion.div 

            initial={{ opacity: 0, y: 20 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="text-center mb-20"

          >

            <h2 className="text-4xl md:text-6xl font-bold mb-4">HISTORY OF HUSTLE<span className="text-[#d4ff00]">.</span></h2>

            <p className="text-gray-400">멈추지 않고 달려온 성장의 궤적입니다.</p>

          </motion.div>

          <div className="relative border-l border-white/10 ml-4 md:ml-1/2 space-y-16">

            {HISTORY.map((item, idx) => (

              <motion.div 

                key={idx}

                initial={{ opacity: 0, x: -20 }}

                whileInView={{ opacity: 1, x: 0 }}

                viewport={{ once: true, margin: "-100px" }}

                transition={{ delay: idx * 0.1 }}

                className="relative pl-8 md:pl-0"

              >

                {/* Dot */}

                <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 ${item.type === 'milestone' || item.type === 'award' ? 'bg-[#d4ff00] border-[#d4ff00]' : 'bg-[#050505] border-gray-600'} z-10 transition-colors duration-300`}></div>

                

                <div className={`md:flex items-start justify-between group ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                   {/* Date for Desktop */}

                   <div className={`hidden md:block w-1/2 ${idx % 2 === 0 ? 'pl-12 text-left' : 'pr-12 text-right'}`}>

                      <span className="text-[#d4ff00] font-mono text-xl font-bold">{item.year}</span>

                   </div>

                   {/* Content */}

                   <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>

                      <div className="md:hidden text-[#d4ff00] font-mono text-sm font-bold mb-1">{item.year}</div>

                      <h4 className={`text-xl font-bold mb-2 group-hover:text-[#d4ff00] transition-colors ${item.type === 'award' ? 'text-white' : 'text-gray-200'}`}>

                        {item.title}

                      </h4>

                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>

                   </div>

                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* Projects Section */}

      <section id="projects" className="py-32 px-6 bg-[#0a0a0a]">

        <div className="max-w-7xl mx-auto">

          <div className="flex items-end justify-between mb-20 border-b border-white/10 pb-6">

            <div>

              <h2 className="text-4xl md:text-6xl font-bold">WORK<span className="text-[#d4ff00]">.</span></h2>

              <p className="text-gray-400 mt-2">클릭하여 프로젝트 상세 내용을 확인하세요.</p>

            </div>

            <span className="text-gray-500 font-mono hidden md:block">SELECTED PROJECTS 2023 — 2025</span>

          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {PROJECTS.map((project) => (

              <motion.div

                key={project.id}

                layoutId={`project-container-${project.id}`}

                onClick={() => setSelectedProject(project)}

                whileHover={{ y: -10 }}

                className="group cursor-pointer bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-[#d4ff00]/50 transition-all duration-300"

              >

                <div className="aspect-[16/9] overflow-hidden relative">

                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />

                   <motion.img 

                     layoutId={`project-image-${project.id}`}

                     src={project.image} 

                     alt={project.title} 

                     className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"

                   />

                </div>

                <div className="p-8">

                  <motion.div layoutId={`project-category-${project.id}`} className="text-[#d4ff00] font-mono text-xs tracking-widest mb-3">

                    {project.category}

                  </motion.div>

                  <motion.h3 layoutId={`project-title-${project.id}`} className="text-2xl font-bold mb-3 group-hover:text-[#d4ff00] transition-colors">

                    {project.title}

                  </motion.h3>

                  <motion.p layoutId={`project-subtitle-${project.id}`} className="text-gray-400 text-sm line-clamp-2 leading-relaxed">

                    {project.subtitle}

                  </motion.p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white group-hover:translate-x-2 transition-transform">

                    View Case Study <ArrowRight className="w-4 h-4" />

                  </div>

                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* Project Modal */}

      <AnimatePresence>

        {selectedProject && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/80 backdrop-blur-sm"

            onClick={() => setSelectedProject(null)}

          >

            <motion.div

              layoutId={`project-container-${selectedProject.id}`}

              className="bg-[#111] w-full max-w-4xl max-h-full overflow-y-auto rounded-2xl border border-white/10 shadow-2xl relative scrollbar-hide"

              onClick={(e) => e.stopPropagation()}

            >

              <button 

                onClick={() => setSelectedProject(null)}

                className="absolute top-6 right-6 z-20 p-2 bg-black/50 rounded-full hover:bg-[#d4ff00] hover:text-black transition-colors"

              >

                <X className="w-6 h-6" />

              </button>

              <div className="aspect-video w-full relative">

                 <motion.img 

                    layoutId={`project-image-${selectedProject.id}`}

                    src={selectedProject.image}

                    className="w-full h-full object-cover"

                 />

                 <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>

                 <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">

                    <motion.div layoutId={`project-category-${selectedProject.id}`} className="text-[#d4ff00] font-mono text-sm tracking-widest mb-2">

                        {selectedProject.category}

                    </motion.div>

                    <motion.h3 layoutId={`project-title-${selectedProject.id}`} className="text-3xl md:text-5xl font-bold leading-tight">

                        {selectedProject.title}

                    </motion.h3>

                 </div>

              </div>

              <div className="p-8 md:p-12 grid md:grid-cols-[2fr_1fr] gap-12">

                <div>

                   <h4 className="text-xl font-bold mb-4 text-white">Project Overview</h4>

                   <motion.p layoutId={`project-subtitle-${selectedProject.id}`} className="text-xl text-white font-medium mb-6 leading-relaxed">

                     {selectedProject.subtitle}

                   </motion.p>

                   <div className="space-y-6 text-gray-400 leading-relaxed text-lg">

                      <p>{selectedProject.description}</p>

                      <p className="text-gray-300 bg-white/5 p-6 rounded-lg border-l-2 border-[#d4ff00]">

                        {selectedProject.detailDescription}

                      </p>

                   </div>

                   <div className="mt-8 flex flex-wrap gap-2">

                     {selectedProject.tags.map((tag) => (

                       <span key={tag} className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-300 border border-white/10">

                         #{tag}

                       </span>

                     ))}

                   </div>

                </div>

                <div className="space-y-8">

                   <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">

                      <h5 className="text-sm font-mono text-gray-500 mb-4 border-b border-white/10 pb-2">KEY METRICS & INFO</h5>

                      <div className="space-y-6">

                        {selectedProject.stats.map((stat, idx) => (

                           <div key={idx}>

                              <div className="text-xs text-gray-500 mb-1 font-mono uppercase">{stat.label}</div>

                              <div className="text-xl font-bold text-white">{stat.value}</div>

                           </div>

                        ))}

                      </div>

                   </div>

                   

                   <button className="w-full py-4 bg-[#d4ff00] text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2">

                      Request Full Case Study <Mail className="w-4 h-4"/>

                   </button>

                </div>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

      {/* Zero to One Section */}

      <section id="zerotoone" className="py-32 px-6 bg-[#050505] border-t border-white/5">

        <div className="max-w-7xl mx-auto">

          <div className="mb-16">

             <h2 className="text-4xl md:text-6xl font-bold mb-4">ZERO TO ONE<span className="text-[#d4ff00]">.</span></h2>

             <p className="text-gray-400 text-lg">무에서 유를 창조하는 실행력, 그것이 저의 본질입니다.</p>

          </div>

          

          <div className="grid md:grid-cols-2 gap-8">

            <ZeroOneCard 

                title="JB ORCA 야구단 창단"

                role="FOUNDER"

                desc="야구를 하고 싶다는 단순한 열정으로 시작해, 3명에서 27명의 조직으로 성장시켰습니다. 로고 디자인부터 유니폼 제작, 구단 운영 시스템 구축까지 모든 과정을 주도했습니다."

                items={[

                    "2023년 창단, 현재 27명 규모",

                    "브랜딩 및 굿즈(헬멧, 유니폼) 직접 제작",

                    "공식 홈페이지 구축 및 커뮤니티 운영"

                ]}

            />

            <ZeroOneCard 

                title="파이오닉스랩 공동창업"

                role="CO-FOUNDER"

                desc="그로스 마케팅 대행사를 공동 창업하며 비즈니스의 A to Z를 경험했습니다. 클라이언트의 성장이 곧 우리의 성장이라는 마인드로, 실질적인 매출 증대를 위한 전략을 수립하고 실행했습니다."

                items={[

                    "Growth Marketing Lead",

                    "스타트업 클라이언트 대상 마케팅 솔루션 제공",

                    "초기 비즈니스 모델 구축 참여"

                ]}

            />

          </div>

        </div>

      </section>

      {/* Contact Section */}

      <section id="contact" className="py-32 px-6 bg-[#0a0a0a]">

        <div className="max-w-7xl mx-auto text-center">

            <motion.div

                initial={{ opacity: 0, y: 20 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

            >

                <h2 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight">

                    READY TO <span className="text-[#d4ff00]">SPRINT?</span>

                </h2>

                <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto font-light">

                    혁신을 꿈꾸는 조직에 가장 필요한 연료가 되겠습니다.<br/>

                    커피챗은 언제나 환영입니다.

                </p>

                

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mb-24">

                    <ContactLink href="mailto:gy0408@naver.com" Icon={Mail} text="gy0408@naver.com" />

                    <ContactLink href="tel:010-4920-8727" Icon={Phone} text="010-4920-8727" />

                    <ContactLink href="https://linkedin.com/in/102536gy" Icon={ExternalLink} text="LinkedIn Profile" />

                </div>

                

                <div className="flex justify-between items-end border-t border-white/10 pt-8 text-sm text-gray-600">

                    <div>

                        <p>© 2025 Lee Geon Yong.</p>

                        <p>All Hustle Reserved.</p>

                    </div>

                    <div className="text-right font-mono text-xs">

                        DESIGNED & DEVELOPED<br/>

                        WITH PURE PASSION

                    </div>

                </div>

            </motion.div>

        </div>

      </section>

    </div>

  );

};

// --- SUB COMPONENTS ---

const ZeroOneCard = ({ title, role, desc, items }) => (

    <div className="bg-[#111] p-10 rounded-2xl border border-white/5 hover:border-[#d4ff00]/50 transition-all group hover:-translate-y-2 duration-300">

        <div className="flex justify-between items-start mb-6">

            <h3 className="text-2xl font-bold group-hover:text-[#d4ff00] transition-colors">{title}</h3>

            <span className="font-mono text-xs text-gray-500 border border-white/10 px-3 py-1 rounded-full">{role}</span>

        </div>

        <p className="text-gray-400 mb-8 leading-relaxed">

            {desc}

        </p>

        <ul className="text-sm text-gray-500 space-y-3">

            {items.map((item, idx) => (

                <li key={idx} className="flex items-center gap-3">

                    <div className="w-1.5 h-1.5 bg-[#d4ff00] rounded-full"></div>

                    {item}

                </li>

            ))}

        </ul>

    </div>

);

const ContactLink = ({ href, Icon, text }) => (

    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-lg md:text-xl font-medium hover:text-[#d4ff00] transition-colors group">

        <span className="p-3 bg-white/5 rounded-full group-hover:bg-[#d4ff00] group-hover:text-black transition-all">

            <Icon size={20} />

        </span>

        {text}

    </a>

);

export default App;
