import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AnalyticsContext = createContext();

export const useAnalytics = () => useContext(AnalyticsContext);

export const AnalyticsProvider = ({ children }) => {
    const location = useLocation();
    const visitIdRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    // Generate or retrieve persistent visitor ID
    const getVisitorId = () => {
        let vid = localStorage.getItem('visitor_id');
        if (!vid) {
            vid = crypto.randomUUID();
            localStorage.setItem('visitor_id', vid);
        }
        return vid;
    };

    const trackPageView = async (path) => {
        // 1. Close previous visit if exists
        try {
            if (visitIdRef.current) {
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                await supabase
                    .from('analytics_visits')
                    .update({ duration })
                    .eq('id', visitIdRef.current);
            }
        } catch (err) {
            console.error('Failed to update visit duration:', err);
        }

        // 2. Start new visit
        try {
            const visitorId = getVisitorId();
            const deviceType = window.innerWidth < 768 ? 'mobile' : 'desktop';
            const screenWidth = window.innerWidth;

            startTimeRef.current = Date.now();

            const { data, error } = await supabase
                .from('analytics_visits')
                .insert([{
                    path,
                    visitor_id: visitorId,
                    device_type: deviceType,
                    screen_width: screenWidth
                }])
                .select()
                .single();

            if (data) {
                visitIdRef.current = data.id;
            } else if (error) {
                // Silent fail for analytics to not disturb user
                console.warn('Analytics insert error (table might not exist):', error.message);
            }
        } catch (err) {
            console.error('Analytics tracking error:', err);
        }
    };

    useEffect(() => {
        trackPageView(location.pathname);
    }, [location.pathname]);

    // Cleanup on unmount (less common in SPA root, but good practice)
    useEffect(() => {
        return () => {
            if (visitIdRef.current) {
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                supabase
                    .from('analytics_visits')
                    .update({ duration })
                    .eq('id', visitIdRef.current)
                    .then(() => { });
            }
        };
    }, []);

    return (
        <AnalyticsContext.Provider value={{}}>
            {children}
        </AnalyticsContext.Provider>
    );
};
