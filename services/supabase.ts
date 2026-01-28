
import { createClient } from '@supabase/supabase-js';

/**
 * MARIA: Este archivo lee tus claves dinámicamente.
 * Si no están puestas en Ajustes, usará LocalStorage por defecto.
 */

const getSupabaseConfig = () => {
  try {
    const savedInt = localStorage.getItem('mdc_integrations');
    if (savedInt) {
      const config = JSON.parse(savedInt);
      if (config.supabaseUrl && config.supabaseKey) {
        return {
          url: config.supabaseUrl,
          key: config.supabaseKey,
          isActive: true
        };
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config', e);
  }
  return {
    url: 'https://placeholder.supabase.co',
    key: 'placeholder-key',
    isActive: false
  };
};

const config = getSupabaseConfig();

// Solo creamos el cliente real si hay una configuración válida
export const supabase = config.isActive 
  ? createClient(config.url, config.key)
  : null;

export const db = {
  invoices: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('date', { ascending: false });
          if (!error) return data;
        } catch (e) { console.error('Supabase error', e); }
      }
      return JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
    },
    async save(invoice: any) {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .insert([invoice])
            .select();
          if (!error) return data[0];
        } catch (e) { console.error('Supabase save error', e); }
      }
      const existing = JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
      localStorage.setItem('mdc_invoices', JSON.stringify([invoice, ...existing]));
      return invoice;
    }
  },
  clients: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');
          if (!error) return data;
        } catch (e) { console.error('Supabase error', e); }
      }
      return JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    },
    async create(client: any) {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .insert([client])
            .select();
          if (!error) return data[0];
        } catch (e) { console.error('Supabase create error', e); }
      }
      const existing = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
      localStorage.setItem('mdc_clients', JSON.stringify([...existing, client]));
      return client;
    }
  },
  inventory: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('inventory').select('*');
          if (!error) return data;
        } catch (e) { console.error('Supabase error', e); }
      }
      return JSON.parse(localStorage.getItem('mdc_inventory') || '[]');
    },
    async updateStock(id: string, newQty: number) {
      if (supabase) {
        try {
          const { error } = await supabase
            .from('inventory')
            .update({ quantity: newQty })
            .eq('id', id);
          if (!error) return;
        } catch (e) { console.error('Supabase update error', e); }
      }
      const existing = JSON.parse(localStorage.getItem('mdc_inventory') || '[]');
      const updated = existing.map((i: any) => i.id === id ? {...i, quantity: newQty} : i);
      localStorage.setItem('mdc_inventory', JSON.stringify(updated));
    }
  }
};
