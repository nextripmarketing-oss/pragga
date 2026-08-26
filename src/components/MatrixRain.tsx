import React, { useEffect, useRef } from 'react';

export const MatrixRain: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let drops: number[] = [];
        const fontSize = 16;
        let columns = 0;

        // Mix of Bengali, Katakana, Latin, and Digits for the hacker feel
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁアァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
        const chars = letters.split('');

        const initCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.floor(canvas.width / fontSize);
            drops = [];
            for (let x = 0; x < columns; x++) {
                // Randomize initial vertical position so they don't all start at the same time
                drops[x] = Math.random() * -(canvas.height / fontSize) * 2;
            }
        };

        let lastTime = 0;
        const fps = 30; // Control speed
        const interval = 1000 / fps;

        const draw = (currentTime: number) => {
            animationFrameId = requestAnimationFrame(draw);
            
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > interval) {
                // Translucent black background to create trail
                ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.font = `${fontSize}px monospace`;
                ctx.textAlign = 'center';

                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    const x = i * fontSize + (fontSize / 2);
                    const y = drops[i] * fontSize;
                    
                    // The lead character occasionally flashes bright/white
                    if (Math.random() > 0.95) {
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#ffffff';
                    } else {
                        ctx.fillStyle = '#22c55e'; // tailwind green-500
                        ctx.shadowBlur = 2;
                        ctx.shadowColor = '#22c55e';
                    }

                    // Only draw if on screen
                    if (y > 0 && y < canvas.height + fontSize) {
                        ctx.fillText(text, x, y);
                    }

                    // Reset drops when they reach the bottom or randomly
                    if (y > canvas.height && Math.random() > 0.95) {
                        drops[i] = 0;
                    }

                    drops[i]++;
                }
                
                // reset shadow
                ctx.shadowBlur = 0;
                
                lastTime = currentTime - (deltaTime % interval);
            }
        };

        initCanvas();
        animationFrameId = requestAnimationFrame(draw);

        window.addEventListener('resize', initCanvas);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', initCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-20"
        />
    );
};
