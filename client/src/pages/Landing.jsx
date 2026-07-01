import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPlatformStats } from '../api/api.js';
import { Heart, Users, Gift } from 'lucide-react';
import weddingImg from '../assets/images/wedding.png';

const Landing = () => {
  const [stats, setStats] = useState({
    totalRaised: 0,
    weddingCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await fetchPlatformStats();

        setStats({
          totalRaised: data.totalRaised || 0,
          weddingCount: data.weddingCount || 0,
        });
      } catch (error) {
        console.error('Failed to load platform stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f8f4ed] via-white to-[#efe2cf]">

      {/* HERO */}
      <section className="relative flex-1 flex items-center">
        <div className="container mx-auto px-6">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* LEFT */}
            <div className="space-y-10">

              <div className="space-y-3">

                <h1 className="text-5xl font-serif leading-tight text-[#2d2218] lg:text-6xl">
                  Build Your Wedding
                  <span
                    className={`mt-2 block bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00] bg-clip-text text-transparent`}
                  >
                    Together
                  </span>
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-[#6f6257]">
                  A modern way for friends and family to support your big day.
                  No more random gifts — just meaningful contributions.
                </p>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-4 sm:flex-row">

                <Link
                  to="/auth"
                  className={`${goldGradient} rounded-full px-8 py-4 text-center font-bold text-white shadow-lg shadow-[#8B5A00]/20 transition hover:scale-105 hover:shadow-xl hover:brightness-110`}
                >
                  Start Your Registry
                </Link>

                <Link
                  to="/find-wedding"
                  className="rounded-full border border-[#B8860B] px-8 py-4 text-center font-bold text-[#8B5A00] transition hover:bg-[#B8860B] hover:text-white"
                >
                  Find a Wedding
                </Link>
              </div>

              {/* TRUST */}
              <div className="flex items-center gap-3 w-fit rounded-full bg-white px-5 py-3 shadow-md border border-[#eadbc4]">
                
                <Users className="h-5 w-5 text-[#B8860B]" />

                <span className="text-sm font-semibold text-[#2d2218]">
                  {stats.weddingCount.toLocaleString()}+ couples trust ZeAlpha
                </span>
              </div>

              {/* STATS */}
              {statsLoading ? (
                <div className="grid grid-cols-2 gap-5 pt-4">
                  <div className="rounded-2xl bg-white/80 p-5 shadow-md border border-[#f0e2cf] animate-pulse">
                    <div className="h-8 w-24 rounded bg-[#ead9c0]"></div>
                    <div className="mt-2 h-4 w-20 rounded bg-[#ead9c0]"></div>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-5 shadow-md border border-[#f0e2cf] animate-pulse">
                    <div className="h-8 w-16 rounded bg-[#ead9c0]"></div>
                    <div className="mt-2 h-4 w-20 rounded bg-[#ead9c0]"></div>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-5 pt-4">

                <div className="rounded-2xl bg-white p-5 shadow-md border border-[#f0e2cf]">

                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[#B8860B]" />

                    <span className="text-xl font-bold text-[#2d2218]">
                      ETB {stats.totalRaised.toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#6f6257]">
                    Total Funded
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-md border border-[#f0e2cf]">

                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-[#B8860B]" />

                    <span className="text-xl font-bold text-[#2d2218]">
                      {stats.weddingCount.toLocaleString()}+
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#6f6257]">
                    Happy Couples
                  </p>
                </div>

              </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="relative flex justify-center">

              {/* GLOW */}
              <div className="absolute w-80 h-80 rounded-full bg-[#B8860B]/15 blur-3xl"></div>

              {/* CARD */}
              <div className="relative w-full max-w-md">

                <div className="rounded-3xl bg-white p-4 shadow-2xl border border-[#eadbc4]">

                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={weddingImg}
                      alt="Wedding couple"
                      className="w-full h-full object-cover"
                    />
                  </div>

                </div>

                {/* FLOATING LEFT */}
                <div className="absolute -bottom-5 -left-5 rounded-xl bg-white px-4 py-3 shadow-lg border border-[#eadbc4]">
                  
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>

                    <span className="text-xs font-semibold text-[#2d2218]">
                      Live Registry
                    </span>
                  </div>
                </div>

                {/* FLOATING RIGHT */}
                <div
                  className={`${goldGradient} absolute -top-5 -right-5 rounded-xl px-4 py-3 shadow-lg`}
                >
                  <div className="text-center text-white">
                    
                    <div className="text-lg font-bold">
                      {stats.weddingCount > 0 ? '97%' : '0%'}
                    </div>

                    <div className="text-[10px] opacity-80">
                      Goals Funded
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;