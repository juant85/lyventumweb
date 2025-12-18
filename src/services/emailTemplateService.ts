// src/services/emailTemplateService.ts
import { supabase } from '../supabaseClient';

interface TemplateVariables {
  ACCESS_CODE?: string;
  ATTENDEE_NAME?: string;
  EVENT_NAME?: string;
  EVENT_LOGO_URL?: string;
  LOGIN_URL?: string;
  EVENT_DATES?: string;
  EVENT_VENUE?: string;
  SUPPORT_EMAIL?: string;
  PLATINUM_SPONSOR?: {
    name: string;
    logo: string;
    website: string;
  } | null;
  GOLD_SPONSORS?: Array<{
    name: string;
    logo: string;
    website: string;
  }>;
  SILVER_SPONSORS?: Array<{
    name: string;
    logo: string;
    website: string;
  }>;
}

export const emailTemplateService = {
  /**
   * Load email template from database
   */
  async loadTemplate(
    eventId: string,
    templateType: 'access_code' | 'session_reminder' | 'daily_agenda'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('bodyHtml')
        .eq('event_id', eventId)
        .eq('template_type', templateType)
        .single();

      if (error) {
        console.warn('[EmailTemplate] Template not found in DB, will use default:', error.message);
        return null;
      }

      return data?.bodyHtml || null;
    } catch (error) {
      console.error('[EmailTemplate] Error loading template:', error);
      return null;
    }
  },

  /**
   * Replace variables in template
   */
  renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template;

    // Replace simple variables
    Object.entries(variables).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value);
      }
    });

    // Handle conditional sections for sponsors
    // {{#if PLATINUM_SPONSOR}}...{{/if}}
    if (variables.PLATINUM_SPONSOR) {
      // Keep the section
      rendered = rendered.replace(
        /{{#if PLATINUM_SPONSOR}}([\s\S]*?){{\/if}}/g,
        '$1'
      );
      // Replace sponsor properties
      rendered = rendered.replace(/{{PLATINUM_SPONSOR\.name}}/g, variables.PLATINUM_SPONSOR.name);
      rendered = rendered.replace(/{{PLATINUM_SPONSOR\.logo}}/g, variables.PLATINUM_SPONSOR.logo);
      rendered = rendered.replace(/{{PLATINUM_SPONSOR\.website}}/g, variables.PLATINUM_SPONSOR.website);
    } else {
      // Remove the section
      rendered = rendered.replace(/{{#if PLATINUM_SPONSOR}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle GOLD_SPONSORS array
    if (variables.GOLD_SPONSORS && variables.GOLD_SPONSORS.length > 0) {
      rendered = rendered.replace(
        /{{#if GOLD_SPONSORS}}([\s\S]*?){{\/if}}/g,
        '$1'
      );

      // Replace each loop
      const goldMatch = rendered.match(/{{#each GOLD_SPONSORS}}([\s\S]*?){{\/each}}/);
      if (goldMatch) {
        const itemTemplate = goldMatch[1];
        const goldHtml = variables.GOLD_SPONSORS.map(sponsor => {
          return itemTemplate
            .replace(/{{this\.name}}/g, sponsor.name)
            .replace(/{{this\.logo}}/g, sponsor.logo)
            .replace(/{{this\.website}}/g, sponsor.website);
        }).join('');
        rendered = rendered.replace(/{{#each GOLD_SPONSORS}}[\s\S]*?{{\/each}}/, goldHtml);
      }
    } else {
      rendered = rendered.replace(/{{#if GOLD_SPONSORS}}[\s\S]*?{{\/if}}/g, '');
    }

    // Handle SILVER_SPONSORS array
    if (variables.SILVER_SPONSORS && variables.SILVER_SPONSORS.length > 0) {
      rendered = rendered.replace(
        /{{#if SILVER_SPONSORS}}([\s\S]*?){{\/if}}/g,
        '$1'
      );

      const silverMatch = rendered.match(/{{#each SILVER_SPONSORS}}([\s\S]*?){{\/each}}/);
      if (silverMatch) {
        const itemTemplate = silverMatch[1];
        const silverHtml = variables.SILVER_SPONSORS.map(sponsor => {
          return itemTemplate
            .replace(/{{this\.name}}/g, sponsor.name)
            .replace(/{{this\.logo}}/g, sponsor.logo)
            .replace(/{{this\.website}}/g, sponsor.website);
        }).join('');
        rendered = rendered.replace(/{{#each SILVER_SPONSORS}}[\s\S]*?{{\/each}}/, silverHtml);
      }
    } else {
      rendered = rendered.replace(/{{#if SILVER_SPONSORS}}[\s\S]*?{{\/if}}/g, '');
    }

    return rendered;
  },

  /**
   * Get default template (fallback)
   */
  getDefaultTemplate(templateType: 'access_code' | 'session_reminder' | 'daily_agenda'): string {
    if (templateType === 'access_code') {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Access Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to {{EVENT_NAME}}!</h1>
            </td>
          </tr>
          
          <!-- Access Code -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0;">Your Access Code</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Use this code to access your personalized event agenda.
              </p>
              
              <div style="background-color: #f1f5f9; border: 2px dashed #2563eb; border-radius: 8px; padding: 30px; margin: 0 0 30px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  {{ACCESS_CODE}}
                </div>
              </div>
              
              <a href="{{LOGIN_URL}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                🚀 Login to Event Portal
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #1e293b; color: #94a3b8;">
              <p style="margin: 0 0 10px 0; font-size: 14px;">{{EVENT_NAME}}</p>
              <p style="margin: 0; font-size: 12px;">
                Need help? Contact us at <a href="mailto:{{SUPPORT_EMAIL}}" style="color: #06b6d4; text-decoration: none;">{{SUPPORT_EMAIL}}</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
    }

    // Default for other types
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>{{EVENT_NAME}}</h1>
          <p>This is a default template.</p>
        </body>
      </html>
    `;
  },

  /**
   * Load sponsors for event
   */
  async loadSponsors(eventId: string) {
    try {
      const { data: booths, error } = await supabase
        .from('booths')
        .select('companyName, sponsorLogoUrl, sponsorWebsiteUrl, sponsorshipTier, isSponsor')
        .eq('event_id', eventId)
        .eq('isSponsor', true);

      if (error) {
        console.error('[EmailTemplate] Error loading sponsors:', error);
        return { platinum: null, gold: [], silver: [] };
      }

      const platinum = booths?.find(b => b.sponsorshipTier === 'platinum') || null;
      const gold = booths?.filter(b => b.sponsorshipTier === 'gold') || [];
      const silver = booths?.filter(b => b.sponsorshipTier === 'silver') || [];

      return {
        platinum: platinum ? {
          name: platinum.companyName,
          logo: platinum.sponsorLogoUrl || '',
          website: platinum.sponsorWebsiteUrl || '#'
        } : null,
        gold: gold.map(b => ({
          name: b.companyName,
          logo: b.sponsorLogoUrl || '',
          website: b.sponsorWebsiteUrl || '#'
        })),
        silver: silver.map(b => ({
          name: b.companyName,
          logo: b.sponsorLogoUrl || '',
          website: b.sponsorWebsiteUrl || '#'
        }))
      };
    } catch (error) {
      console.error('[EmailTemplate] Error in loadSponsors:', error);
      return { platinum: null, gold: [], silver: [] };
    }
  },

  /**
   * Get complete template with all data
   */
  async getCompleteTemplate(
    eventId: string,
    templateType: 'access_code' | 'session_reminder' | 'daily_agenda',
    variables: Partial<TemplateVariables>
  ): Promise<string> {
    // Load template from DB or use default
    let template = await this.loadTemplate(eventId, templateType);
    if (!template) {
      console.log('[EmailTemplate] Using default template');
      template = this.getDefaultTemplate(templateType);
    }

    // Load sponsors
    const sponsors = await this.loadSponsors(eventId);

    // Merge all variables
    const allVariables: TemplateVariables = {
      ...variables,
      PLATINUM_SPONSOR: sponsors.platinum,
      GOLD_SPONSORS: sponsors.gold,
      SILVER_SPONSORS: sponsors.silver,
    };

    // Render template
    return this.renderTemplate(template, allVariables);
  }
};

export type { TemplateVariables };
