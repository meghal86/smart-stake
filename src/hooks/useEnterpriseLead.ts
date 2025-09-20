import { supabase } from '@/integrations/supabase/client';

interface EnterpriseLeadData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export const useEnterpriseLead = () => {
  const saveEnterpriseLead = async (data: EnterpriseLeadData) => {
    const { error } = await supabase
      .from('enterprise_leads')
      .insert([{
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message,
        created_at: new Date().toISOString(),
      }]);

    if (error) {
      throw new Error(error.message);
    }
  };

  return { saveEnterpriseLead };
};