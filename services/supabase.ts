
/**
 * SUPABASE CONFIGURATION
 * To deploy: 
 * 1. Create a Supabase project
 * 2. Get your URL and Anon Key
 * 3. Use standard ESM imports if adding the client library
 * 
 * Note: For this demo, we use localStorage to persist state, 
 * but the structure is ready for the real client.
 */

// In a real app: import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export const db = {
  invoices: {
    async getAll() {
      const data = localStorage.getItem('invoices');
      return data ? JSON.parse(data) : [];
    },
    async save(invoice: any) {
      const existing = await this.getAll();
      const updated = [...existing, invoice];
      localStorage.setItem('invoices', JSON.stringify(updated));
      return invoice;
    }
  },
  clients: {
    async getAll() {
      const data = localStorage.getItem('clients');
      return data ? JSON.parse(data) : [];
    }
  }
};
