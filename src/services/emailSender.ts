import { supabase } from '../supabaseClient';

interface SendEmailParams {
    type: 'test' | 'access_code' | 'welcome' | 'ticket';
    recipientEmail: string;
    code?: string;
    html: string;
    eventId: string;
    subject?: string;
}

export const sendEmailViaEdgeFunction = async (params: SendEmailParams) => {
    console.log('📧 Sending email via Edge Function:', params.type, params.recipientEmail);

    const { data, error } = await supabase.functions.invoke('send-email', {
        body: params
    });

    if (error) {
        console.error('❌ Edge Function Error:', error);
        return { success: false, error: error.message };
    }

    if (data?.error) {
        console.error('❌ Email Send Error:', data.error);
        return { success: false, error: data.error };
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
};
