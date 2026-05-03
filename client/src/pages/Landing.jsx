import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPlatformStats } from '../api/api.js';
import { Heart, Users, Gift } from 'lucide-react';
import weddingImg from '../assets/images/wedding.png';

const Landing = () => {
  const [stats, setStats] = useState({ totalRaised: 0, weddingCount: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchPlatformStats();
        setStats({
          totalRaised: data.totalRaised || 0,
          weddingCount: data.weddingCount || 0,
        });
      } catch (error) {
        console.error('Failed to load platform stats:', error);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-ivory via-white to-primary/5">

      {/* HERO */}
      <section className="relative flex-1 flex items-center">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* LEFT */}
            <div className="space-y-10 animate-fadeUp">
              
              <div className="space-y-2">
                <h1 className="text-5xl font-serif leading-tight text-dark lg:text-6xl">
                  Build Your Wedding
                  <span className="block text-primary mt-2">
                    Together
                  </span>
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-secondary">
                  A modern way for friends and family to support your big day.
                  No more random gifts — just meaningful contributions.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/auth"
                  className="rounded-full bg-primary px-8 py-4 text-center font-medium text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                >
                  Start Your Registry
                </Link>

                <Link
                  to="/my-gifts"
                  className="rounded-full border border-primary px-8 py-4 text-center font-medium text-primary transition hover:bg-primary hover:text-white"
                >
                  Find a Wedding
                </Link>
              </div>

              <div className="flex items-center gap-3 w-fit rounded-full bg-white px-5 py-3 shadow-md">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-dark">
                  {stats.weddingCount.toLocaleString()}+ couples trust Zealpha
                </span>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-4">
                <div className="rounded-2xl bg-white p-5 shadow-md">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold text-dark">
                      ${stats.totalRaised.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-secondary">Total Funded</p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-md">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold text-dark">
                      {stats.weddingCount.toLocaleString()}+
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-secondary">Happy Couples</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative flex justify-center animate-fadeUp delay-200">

              {/* GLOW */}
              <div className="absolute w-80 h-80 bg-primary/20 blur-3xl rounded-full"></div>

              {/* CARD */}
              <div className="relative w-full max-w-md">
                <div className="rounded-3xl bg-white p-4 shadow-2xl">

                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <img
                      src={weddingImg}
                      alt="Wedding couple"
                      className="w-full h-full object-cover"
                    />
                  </div>

                </div>

                {/* FLOATING LEFT */}
                <div className="absolute -bottom-5 -left-5 rounded-xl bg-white px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
                    <span className="text-xs font-medium text-dark">
                      Live Registry
                    </span>
                  </div>
                </div>

                {/* FLOATING RIGHT */}
                <div className="absolute -top-5 -right-5 rounded-xl bg-primary px-4 py-3 shadow-lg">
                  <div className="text-center text-white">
                    <div className="text-lg font-bold">98%</div>
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