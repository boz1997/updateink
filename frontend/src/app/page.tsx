'use client';

import React, { useState, useRef, useEffect } from 'react';
import CitySelector from "../components/CitySelector";

export default function Home() {
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ipLoading, setIpLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailValid, setEmailValid] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      quote: "This newsletter has become my favorite way to start the day. The local updates are always relevant, and the tone is just right — casual but insightful.",
      author: "Jenna Park",
      location: "Los Angeles Newsletter",
      initials: "JP"
    },
    {
      id: 2,
      quote: "Concise, smart, and perfectly tailored to the city. I especially love the weekend event suggestions — they've helped me discover so many hidden gems.",
      author: "Danielle Moore",
      location: "Chicago Newsletter",
      initials: "DM"
    },
    {
      id: 3,
      quote: "I love getting local newsletters, but this one I actually open every morning. It's the perfect mix of events, news, and fun recommendations.",
      author: "Mike Kim",
      location: "New York Newsletter",
      initials: "MK"
    }
  ];

  // IP detection
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then(async (data) => {
        if (data.city) {
          // Match IP city with CSV list
          try {
            const { searchCities } = await import('../data/cities');
            const matchingCities = await searchCities(data.city);
            
            if (matchingCities.length > 0) {
              // Pick best match
              const bestMatch = matchingCities[0];
              setCity(bestMatch.value);
              console.log('🏙️ City detected from IP:', bestMatch.label);
            } else {
              // Fallback to raw IP city if not found in CSV
              setCity(data.city);
              console.log('⚠️ IP city not found in CSV:', data.city);
            }
          } catch (error) {
            console.error('City search error:', error);
            setCity(data.city);
          }
        }
        setIpLoading(false);
      })
      .catch((error) => {
        console.error('IP detection failed:', error);
        setIpLoading(false);
      });
  }, []);

  // Email validation - debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(email));
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleDotClick = (index: number) => {
    if (index > currentSlide) {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    } 
    else if (index < currentSlide) {
      setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
    else {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!city.trim() || !emailValid) {
      setError("Please fill in all fields correctly.");
      return;
    }
    
    setLoading(true);
    setSuccess(null);
    setModalOpen(true)
    setError(null);
    
    try {
      console.log('🚀 Sending request to backend...');
      console.log('📧 Request data:', { city: city.trim(), email: email.trim() });
      
      const res = await fetch(`https://regor-backend-app-fgcxhnf8fcetgddn.westeurope-01.azurewebsites.net/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), email: email.trim() }),
      });
      
      console.log('📡 Response status:', res.status);
      console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setSuccess("🎉 Successfully subscribed! Your city information has been saved.");
        setModalOpen(true);
        setEmail("");
        setCity("");
      } else {
        setError(data.details || data.error || "An error occurred.");
      }
    } catch (err: unknown) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : "Cannot reach server.");
    } finally {
      setLoading(false);
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch/swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    
    const endX = e.changedTouches[0].pageX;
    const diffX = startX - endX;
    const threshold = 50; // minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swiped left - go to next
        handleNextClick();
      } else {
        // Swiped right - go to previous
        handlePrevClick();
      }
    }
  };

  // Navigation handlers
  const handlePrevClick = () => {
    setCurrentSlide(prev => prev === 0 ? testimonials.length - 1 : prev - 1);
  };

  const handleNextClick = () => {
    setCurrentSlide(prev => prev === testimonials.length - 1 ? 0 : prev + 1);
  };

  return (
    <div className="relative overflow-hidden bg-white">

      {/* Background Image */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat min-h-screen pb-16 md:pb-0" 
        style={{
          backgroundImage: `url('/Hero.png')`,
          height: 'auto',
          minHeight: '90vh',
        }}
      >

      {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="flex flex-col items-center pt-8 pb-16">
          <img 
            src="/ink logo-01.png" 
            alt="Update INK" 
            className="h-16 mb-4"
            onLoad={() => console.log('Logo loaded')}
            onError={(e) => console.error('Logo failed to load:', e)}
          />
          <div className="relative w-64 lg:w-[1000px] h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex items-start pt-8 lg:pt-8 px-4 lg:px-24 -mt-4 md:mt-0">
          <div className="max-w-4xl w-full">
            
            {/* Content and Form */}
            <div className="text-white space-y-8 text-center lg:text-left lg:backdrop-blur-xs lg:p-4 lg:rounded-lg lg:inline-block">
              {/* Small Label */}
              <p className="text-gray-300 text-sm font-medium tracking-wide">
                Location-Based Updates
              </p>

              {/* Main Headline */}
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Stay in the know,<br />
                wherever you live.
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-300 leading-relaxed">
                Start by selecting your city. We&apos;ll handle the rest.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-3 md:gap-4 max-w-2xl mx-auto lg:mx-0 -mb-16 md:mb-0">
                {/* City Input */}
                <div className="relative w-3/4 md:w-[350px] md:flex-[0.6] lg:flex-1 mx-auto md:mx-0 z-10">
                  <CitySelector
                    value={city}
                    onChange={setCity}
                    placeholder={ipLoading ? "Detecting your location..." : "Choose your city"}
                    disabled={ipLoading}
                    className="[&_.react-select__control]:bg-white [&_.react-select__control]:border-gray-300 [&_.react-select__control]:text-gray-900 [&_.react-select__placeholder]:text-gray-500 [&_.react-select__single-value]:text-gray-900 [&_.react-select__input]:text-gray-900 [&_.react-select__indicators]:text-gray-400 [&_.react-select__menu]:bg-white [&_.react-select__option]:text-gray-700 [&_.react-select__option--is-focused]:bg-blue-50 [&_.react-select__option--is-selected]:bg-blue-600 [&_.react-select__option--is-selected]:text-white"
                  />
                </div>

                {/* Email Input */}
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 md:px-4 py-3 h-12 md:py-1 bg-white text-gray-900 placeholder-gray-500 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-update-blue focus:border-transparent text-sm md:text-base"
                />

                {/* Subscribe Button */}
                <button
                  type="submit"
                  disabled={loading || !city.trim() || !emailValid}
                  className="w-1/2 md:w-auto mx-auto md:mx-0 px-6 md:px-8  h-12 align-middle justify-center bg-update-blue text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4 lg:mb-0 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </form>

              {/* Status Messages */}
              {/* {success && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm animate-fade-in-up">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <span>{success}</span>
                  </div>
                </div>
              )} */}
              

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm animate-fade-in-up">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {(success && modalOpen) && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={() => setModalOpen(false)}>
              <div className="relative flex items-start gap-3 p-6 bg-white rounded-2xl shadow-lg mx-6 sm:max-w-md h-[200px] animate-fade-in-up"
              onClick={(e) => e.stopPropagation()} >
                {/* Green circle with tick */}
                <div className="absolute -top-12 right-1 w-20 h-20 rounded-full flex items-center justify-center ">
                  <img
                    src="/success.svg"
                    alt="Checkmark icon"
                    className="w-20 h-20 text-white"
                  />
                </div>

                {/* Message text */}
                <div className="flex flex-col">
                  <h3 className="text-4xl font-normal text-sky-600">You&apos;re in!</h3>
                  <p className="text-[#3E7DBB] text-lg sm:text-[26px] font-extralight">
                    Thanks for subscribing. We&apos;re redirecting you to Behiiv — hang tight, it&apos;s just a second!
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
        </div>
      </div>

                    {/* Diagonal Blue Footer Bar */}
        <div className="relative bg-[#FAFAFA]">
          <div className="bg-update-blue py-2 transform -skew-y-2 origin-top-left">
            <div className="max-w-6xl mx-auto pl-0 pr-4 -ml-4 -mr-8 marquee-wraper">
              <div className="flex justify-between items-center text-white text-sm md:text-lg lg:text-xl font-normal leading-relaxed whitespace-nowrap h-8 -mt-2 md:mt-0 lg:mt-1 marquee-content">
                <span className="text-xs md:text-base lg:text-lg">
                  Updates from your city.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Highlights from your favorite local teams.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ideas to make the most of your weekend.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;All gathered in one place - curated&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Stay connected with your community
                </span>
                <span className="text-xs md:text-base lg:text-lg">
                  Updates from your city.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Highlights from your favorite local teams.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ideas to make the most of your weekend.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;All gathered in one place - curated&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Stay connected with your community
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Statistics Section */}
      <section className="bg-[#FAFAFA] py-4 px-4 lg:px-24 mt-2 md:mt-0">
        <div className="max-w-6xl mx-auto">
          {/* Section Heading */}
          <h2 className="text-4xl lg:text-5xl font-normal italic text-update-blue text-center mb-12">
            Powering Local
            <span className="block lg:inline"> Updates Nationwide</span>
          </h2>
          <h2 className="text-4xl lg:text-5xl font-normal italic text-update-blue text-center mb-12">
            Where Your Neighbors Go to Stay in the Know.
          </h2>
          
          {/* Statistics Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> */}
            {/* Cities Card */}
            {/* <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-5xl font-bold text-update-blue mb-2">200</div>
              <div className="text-gray-700 text-lg">Cities</div>
            </div> */}
            
            {/* Regions Card */}
            {/* <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-5xl font-bold text-update-blue mb-2">45</div>
              <div className="text-gray-700 text-lg">Regions</div>
            </div> */}
            
            {/* Subscribers Card */}
            {/* <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-5xl font-bold text-update-blue mb-2">3.2 M</div>
              <div className="text-gray-700 text-lg">Subscribers</div>
            </div> */}
          {/* </div> */}
        </div>
      </section>

      {/* What You'll Receive Section */}
      <section className="bg-white py-4 md:py-8 lg:py-8 px-4 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout - Left Column Layout */}
          <div className="block lg:hidden">
            {/* Left Column Image Layout */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Left Column - Coffee Image (moved lower) */}
              <div className="h-80 w-4/5 rounded-lg overflow-hidden mt-16 ml-4">
                <img 
                  src="/latop_cofee.avif" 
                  alt="Laptop and coffee" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Right Column - Basketball and Chair Stacked */}
              <div className="space-y-4 w-full -ml-4">
                {/* Basketball Image */}
                <div className="w-40 h-40 rounded-2xl overflow-hidden">
                  <img 
                    src="/basktbal.jpg" 
                    alt="Sports equipment" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Chair Image */}
                <div className="w-40 h-40 rounded-2xl overflow-hidden">
                  <img 
                    src="/chair.jpeg" 
                    alt="Theater chairs" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Content Below Images */}
            <div className="space-y-4">
              {/* Heading */}
              <h2 className="text-2xl font-semibold text-[#1A73E8] leading-tight">
                What you&apos;ll receive each day
              </h2>

              {/* Main Text */}
              <p className="text-base font-normal text-[#202124] leading-relaxed">
                Get a quick, curated update every morning —<br />
                including top news, sports highlights, and events<br />
                happening in your city.
              </p>

              {/* Bullet Points */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-normal text-[#202124]">Get daily local news that keeps you informed<br />about what&apos;s happening around you.</p>
                </div>
                
                <div className="flex items-start space-x-2">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-normal text-[#202124]">Catch up on local sports highlights, scores,<br />and upcoming games in your area.</p>
                </div>
                
                <div className="flex items-start space-x-2">
                 <div className="w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-normal text-[#202124]">Discover events happening near you—from<br />festivals to neighborhood meetups.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Left Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Coffee Image (moved lower) */}
            <div className="flex justify-center pt-24">
              <div className="w-1/2 h-[500px] rounded-lg overflow-hidden">
                <img 
                  src="/latop_cofee.avif" 
                  alt="Laptop and coffee" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="grid grid-cols-4 gap-8 pt-8">
              {/* Left Side - Two Images Stacked */}
              <div className="space-y-6 w-full -ml-40">
                {/* Basketball Image */}
                <div className="w-48 h-48 rounded-2xl overflow-hidden">
                  <img 
                    src="/basktbal.jpg" 
                    alt="Sports equipment" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Chair Image */}
                <div className="w-48 h-48 rounded-2xl overflow-hidden">
                  <img 
                    src="/chair.jpeg" 
                    alt="Theater chairs" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="space-y-6 col-span-3 -ml-16">
                {/* Heading */}
                <h2 className="text-4xl font-semibold text-[#1A73E8] leading-tight">
                  What you&apos;ll receive each day
                </h2>

                {/* Main Text */}
                <p className="text-lg font-normal text-[#202124] leading-relaxed">
                  Get a quick, curated update every morning —<br />
                  including top news, sports highlights, and events<br />
                  happening in your city.
                </p>

                {/* Bullet Points */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                    <p className="text-base font-normal text-[#202124]">Get daily local news that keeps you informed<br />about what&apos;s happening around you.</p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                    <p className="text-base font-normal text-[#202124]">Catch up on local sports highlights, scores,<br />and upcoming games in your area.</p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8  rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <img 
                      src="/Zap.svg" 
                      alt="Zap icon" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                    <p className="text-base font-normal text-[#202124]">Discover events happening near you—from<br />festivals to neighborhood meetups.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-[#FAFAFA] py-8 px-4 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <h2 className="text-3xl lg:text-4xl font-semibold text-[#1A73E8] text-center mb-12">
            Why People Love It
          </h2>

          {/* Testimonials Container */}
          <div className="overflow-hidden relative">
            <div className="hidden md:flex animate-marquee py-8 space-x-8 md:space-x-20">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={index} className="w-72 md:w-96 h-72 md:h-72 flex-shrink-0">
                <div className="relative bg-white p-6 h-full" style={{ borderRadius: '10px 10px 10px 60px' }}>
                  <div className="absolute inset-0 rounded-[6px_6px_6px_56px]" style={{ 
                    background: 'linear-gradient(to bottom, #3E7DBB, rgba(62, 125, 187, 0))',
                    borderRadius: '10px 10px 10px 60px',
                    padding: '4px',
                    zIndex: -1,
                    margin: '-4px'
                  }}></div>
                  <div className="flex justify-start mb-3">
                    <div className="flex space-x-1">
                      {Array(5).fill(0).map((_, i) => <span key={i} className="text-yellow-400 text-lg">⭐</span>)}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center justify-start">
                    <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-2 text-sm">
                      {testimonial.initials}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800 text-sm">{testimonial.author}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>


            <div className="flex flex-col justify-center items-center py-8 md:hidden">
              <div 
                className="flex items-center space-x-8 md:space-x-20 relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'pan-y' }}
              >

                {/* Previous Card (Left) */}
                <div className="w-72 md:w-96 h-72 md:h-72 transform scale-100 transition-all duration-300">
                  <div className="relative bg-white p-6 h-full" style={{ borderRadius: '10px 10px 10px 60px' }}>
                    <div className="absolute inset-0 rounded-[6px_6px_6px_56px]" style={{ 
                      background: 'linear-gradient(to bottom, #3E7DBB, rgba(62, 125, 187, 0))',
                      borderRadius: '10px 10px 10px 60px',
                      padding: '4px',
                      zIndex: -1,
                      margin: '-4px'
                    }}></div>
                    <div className="flex justify-start mb-3">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-4 text-left">
                      {testimonials[(currentSlide - 1 + testimonials.length) % testimonials.length].quote}
                    </p>
                    <div className="flex items-center justify-start">
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-2 text-sm">
                        {testimonials[(currentSlide - 1 + testimonials.length) % testimonials.length].initials}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800 text-sm">{testimonials[(currentSlide - 1 + testimonials.length) % testimonials.length].author}</div>
                        {/* <div className="text-gray-500 text-xs">{testimonials[(currentSlide - 1 + testimonials.length) % testimonials.length].location}</div> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Card (Center) */}
                <div className="w-72 md:w-96 h-72 md:h-72 transform scale-100 transition-all duration-300">
                  <div className="relative bg-white p-6 h-full" style={{ borderRadius: '10px 10px 10px 60px' }}>
                    <div className="absolute inset-0 rounded-[6px_6px_6px_56px]" style={{ 
                      background: 'linear-gradient(to bottom, #3E7DBB, rgba(62, 125, 187, 0))',
                      borderRadius: '10px 10px 10px 60px',
                      padding: '4px',
                      zIndex: -1,
                      margin: '-4px'
                    }}></div>
                    <div className="flex justify-start mb-3">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-base mb-4 leading-relaxed text-left">
                      {testimonials[currentSlide].quote}
                    </p>
                    <div className="flex items-center justify-start">
                      <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold mr-3">
                        {testimonials[currentSlide].initials}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">{testimonials[currentSlide].author}</div>
                        {/* <div className="text-gray-500 text-sm">{testimonials[currentSlide].location}</div> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Card (Right) */}
                <div className="w-72 md:w-96 h-72 md:h-72 transform scale-100 transition-all duration-300">
                  <div className="relative bg-white p-6 h-full" style={{ borderRadius: '10px 10px 10px 60px' }}>
                    <div className="absolute inset-0 rounded-[6px_6px_6px_56px]" style={{ 
                      background: 'linear-gradient(to bottom, #3E7DBB, rgba(62, 125, 187, 0))',
                      borderRadius: '10px 10px 10px 60px',
                      padding: '4px',
                      zIndex: -1,
                      margin: '-4px'
                    }}></div>
                    <div className="flex justify-start mb-3">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="text-yellow-400 text-lg">⭐</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-4 text-left">
                      {testimonials[(currentSlide + 1) % testimonials.length].quote}
                    </p>
                    <div className="flex items-center justify-start">
                      <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-2 text-sm">
                        {testimonials[(currentSlide + 1) % testimonials.length].initials}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800 text-sm">{testimonials[(currentSlide + 1) % testimonials.length].author}</div>
                        {/* <div className="text-gray-500 text-xs">{testimonials[(currentSlide + 1) % testimonials.length].location}</div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Dots - Mobile Only */}
              <div className="flex md:hidden justify-center mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`mx-2 ${index === 1 ? 'w-10':"w-4"} h-3 rounded-full focus:outline-none ${
                      index===1 ? 'bg-[#3E7DBB]' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section className="relative py-20 px-4 lg:px-24">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/27872.jpg')` }}
        >
        </div>
        
        <div className="relative z-0 max-w-4xl mx-auto">
          <div className="backdrop-blur-lg rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Don&apos;t miss what&apos;s happening<br />around you
              </h2>
              <p className="text-lg text-white opacity-90">
                One email a day. Everything local,<br />all in one place.
              </p>
            </div>
            
                         <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4">
               {/* City Dropdown */}
               <div className="flex-1 relative">
                 <CitySelector
                   value={city}
                   onChange={setCity}
                   placeholder={ipLoading ? "Detecting your location..." : "Choose your city"}
                   disabled={ipLoading}
                   className="[&_.react-select__control]:bg-white [&_.react-select__control]:border-gray-300 [&_.react-select__control]:text-gray-900 [&_.react-select__placeholder]:text-gray-500 [&_.react-select__single-value]:text-gray-900 [&_.react-select__input]:text-gray-900 [&_.react-select__indicators]:text-gray-400 [&_.react-select__menu]:bg-white [&_.react-select__option]:text-gray-700 [&_.react-select__option--is-focused]:bg-blue-50 [&_.react-select__option--is-selected]:bg-blue-600 [&_.react-select__option--is-selected]:text-white"
                 />
               </div>
               
               {/* Email Input */}
               <div className="flex-1">
                 <input 
                   type="email" 
                   placeholder="Enter your email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-500 h-12"
                 />
               </div>
               
               {/* Subscribe Button */}
               <button 
                 type="submit"
                 disabled={loading || !city.trim() || !emailValid}
                 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loading ? "Subscribing..." : "Subscribe"}
               </button>
             </form>

             {/* Status Messages */}
             {/* {success && (
               <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm animate-fade-in-up">
                 <div className="flex items-center gap-2">
                   <span className="text-lg">✅</span>
                   <span>{success}</span>
                 </div>
               </div>
             )} */}

             {error && (
               <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm animate-fade-in-up">
                 <div className="flex items-center gap-2">
                   <span className="text-lg">⚠️</span>
                   <span>{error}</span>
                 </div>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/ink_footer.svg" 
              alt="Logo" 
              className="h-16 mx-auto"
            />
          </div>
          
          {/* Social Media Icons */}
          <div className="flex justify-center space-x-3 mb-8">
            {/* Facebook */}
            <button className="hover:opacity-80 transition-opacity duration-200 bg-transparent border-none p-0">
              <img 
                src="/facbook.avif" 
                alt="Facebook" 
                className="w-14 h-14"
              />
            </button>
            
            {/* Instagram */}
            <button className="hover:opacity-80 transition-opacity duration-200 bg-transparent border-none p-0">
              <img 
                src="/instagram.jpeg" 
                alt="Instagram" 
                className="w-10 h-10"
              />
            </button>
            
            {/* Twitter */}
            <button className="hover:opacity-80 transition-opacity duration-200 bg-transparent border-none p-0">
              <img 
                src="/twiiter.png" 
                alt="Twitter" 
                className="w-7 h-7 ml-3"
              />
            </button>
          </div>
          
          {/* Separator Line */}
          <div className="border-t border-gray-300 mb-6"></div>
          
          {/* Copyright and Legal Links */}
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              Created by Vizio Ventures · 2025 © All rights reserved.
            </div>
            <div className="flex space-x-6">
              <button className="hover:text-gray-700 transition-colors duration-200 bg-transparent border-none p-0 text-gray-500 text-sm">
                Privacy & Policy
              </button>
              <button className="hover:text-gray-700 transition-colors duration-200 bg-transparent border-none p-0 text-gray-500 text-sm">
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
