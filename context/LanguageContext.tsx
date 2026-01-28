
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Menu & General
    "dashboard": "Dashboard",
    "sales": "Sales",
    "messages": "Messages",
    "expenses": "Expenses",
    "inventory": "Stock",
    "clients": "B2B/Clients",
    "reports": "Reports",
    "settings": "Settings",
    "logout": "Logout",
    "admin_management": "Management",
    "wholesale_access": "Wholesale Access",
    "optimal": "Optimal",
    "synchronized": "Synchronized",
    "total": "Total",
    "status": "Status",
    "actions": "Actions",
    "date": "Date",
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "copy": "Copy",
    "copied": "Copied",
    "operating_status": "Operating Status",
    "healthy": "Healthy",

    // Dashboard
    "control_system": "Control System",
    "register_sale": "Register Sale",
    "core_settings": "Core Settings",
    "vat_threshold": "VAT Threshold (HMRC)",
    "used": "Used",
    "annual_limit": "Annual Limit",
    "monthly_performance": "Monthly Performance",
    "operating_profit": "Operating Profit",
    "total_orders": "Total Orders",
    "operation": "Operation",
    "counterparty": "Counterparty",
    "net_amount": "Net Amount",
    "manage_all": "Manage All",
    "bestsellers": "Bestsellers",
    "strategy_2024": "Strategy 2024",
    "explore_partners": "Explore Partners",

    // Invoices / Sales List
    "sales_income": "Sales & Income",
    "business_intelligence": "Maria's Dog Corner Business Intelligence",
    "register_operation": "Register Operation",
    "total_income": "Total Income",
    "transactions": "Transactions",
    "avg_ticket": "Avg. Ticket",
    "per_client": "Per client",
    "collection_rate": "Collection Rate",
    "paid_invoices": "Paid invoices",
    "income_trend": "Income Trend",
    "distribution_channel": "Distribution Channel",
    "search_placeholder": "Search by client, number or reference...",
    "no_records": "No records found in this period",

    // Invoice Builder
    "billing_registration": "Billing Registration",
    "client_info": "Client Information",
    "search_member": "Search Member",
    "retail": "Retail",
    "wholesale": "Wholesale",
    "assign_client_first": "Assign a client first.",
    "client_business": "Client / Business",
    "contact_email": "Contact Email",
    "services_products": "Services & Products",
    "description": "Description",
    "quantity": "Qty",
    "unit_price": "Unit Price",
    "amount": "Amount",
    "new_line": "New line",
    "quick_snacks": "Quick Snacks",
    "print_pdf": "Print PDF",
    "generate_invoice": "Generate Invoice",
    "pay_with_card": "Pay with Card",
    "stripe_secure": "Secure via Stripe",

    // Reports
    "accounting": "Accounting",
    "hmrc_compliance": "HMRC Compliance",
    "pl_statement": "P&L Statement",
    "export_report": "Export Report",
    "tax_provision": "Estimated Tax Provision",
    "real_result": "Real Result (Post-Tax)",

    // Clients
    "client_portfolio": "Client Portfolio",
    "directory_desc": "Partner B2B and Retail Directory",
    "new_member": "New Member",
    "search_clients": "Search by name or email...",
    "name": "Name",
    "b2b_partner": "B2B Partner",
    "particular": "Retail Client",
    "back_to_list": "Back to list",
    "historic_spend": "Historic Spend",
    "last_operation": "Last Operation",

    // Inventory
    "stock_management": "Stock Management",
    "traceability_desc": "Expiry monitoring and UK batch traceability.",
    "new_batch": "Register New Batch",
    "inventory_general": "General Inventory & Supplies",
    "product_batch": "Product / Batch ID",
    "stock_level": "Stock Level",
    "critical_stock": "Critical Stock",
    "expired": "EXPIRED",
    "food_safety": "UK Food Safety Standards",
    "sync_stock": "Sync Stock",
    "total_value": "Total Stock Value",

    // Expenses
    "expense_control": "Expense Control",
    "register_expense": "Register Expense",
    "net_losses": "Net Losses",
    "expense_registry": "Master Expense Registry",

    // Settings
    "core_settings_title": "Core Settings",
    "integrity_desc": "MDC operational integrity and compliance center.",
    "business_bacs": "Business & BACS",
    "integrations": "Integrations",
    "audit_center": "Audit Center",
    "bacs_title": "BACS Transfer Data",
    "beneficiary": "Beneficiary",
    "payment_infra": "Payment Infrastructure",
    "audit_trail": "Audit Trail",
    "operative_sop": "Operative SOPs",
    "health_diagnostic": "Operational Health Diagnostic",
    "download_master": "Download Data Master",

    // Distributor Landing
    "grow_with_mdc": "Grow with MDC",
    "official_partner": "Official Partner Program 2024",
    "join_network": "Join our exclusive network of UK distributors and offer 100% natural gourmet snacks.",
    "distributor_access": "Distributor Access",
    "view_benefits": "View Benefits",
    "loyalty_program": "Loyalty Program & Tiers",
    "scale_desc": "Scale your business and unlock progressive discounts.",
    "units_month": "Units/Month",
    "discount": "Discount",
    "natural_snacks": "100% Natural Snacks",
    "no_additives": "No Additives",
    "uk_sourced": "UK Sourced",
    "ready_partner": "Ready to be an MDC Partner?",
    "request_access": "Request Access Now",

    // Distributor Portal
    "distributor_panel": "Distributor Panel",
    "certified_partner": "Certified Partner",
    "place_order": "Place Order",
    "distributor_tier": "Distributor Tier",
    "accumulated_points": "Accumulated Points",
    "monthly_purchases": "Monthly Purchases",
    "profit_margin": "Profit Margin",
    "earned_margin": "Estimated Profit",

    // Distributor Catalog
    "catalog_b2b": "B2B Catalog",
    "partner_price": "Exclusive prices for partners. Premium gourmet supply.",
    "min_order": "Minimum 6 units (Missing {0})",
    "pay_stripe": "Pay via Stripe Secure",
    "order_completed": "Order Completed!",
    "transaction_processed": "Transaction processed via Stripe. Your stock is reserved.",
    "profit_per_unit": "Profit/unit",

    // Login
    "login_platform": "Management & B2B Platform",
    "user_label": "User (admin / distributor)",
    "access_key": "Access Key",
    "enter_ecosystem": "Enter Ecosystem",
    "want_be_distributor": "I want to be a Distributor",
    "encrypted_system": "MDC Encrypted System",

    // Messages Page
    "internal_chat_title": "Internal Messaging",
    "customer_info": "Customer Information",
    "online": "Online",
    "msg_history": "Sales History"
  },
  es: {
    // Menu & General
    "dashboard": "Dashboard",
    "sales": "Ventas",
    "messages": "Mensajes",
    "expenses": "Gastos",
    "inventory": "Stock",
    "clients": "B2B/Clientes",
    "reports": "Reportes",
    "settings": "Ajustes",
    "logout": "Cerrar Sesión",
    "admin_management": "Gestión",
    "wholesale_access": "Acceso Mayorista",
    "optimal": "Óptimo",
    "synchronized": "Sincronizado",
    "total": "Total",
    "status": "Estado",
    "actions": "Acciones",
    "date": "Fecha",
    "save": "Guardar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Eliminar",
    "copy": "Copiar",
    "copied": "Copiado",
    "operating_status": "Estado Operativo",
    "healthy": "Saludable",

    // Dashboard
    "control_system": "Sistema de Control",
    "register_sale": "Registrar Venta",
    "core_settings": "Ajustes Core",
    "vat_threshold": "Umbral de IVA (HMRC)",
    "used": "Utilizado",
    "annual_limit": "Límite Anual",
    "monthly_performance": "Desempeño Mensual",
    "operating_profit": "Profit Operativo",
    "total_orders": "Pedidos Totales",
    "operation": "Operación",
    "counterparty": "Contraparte",
    "net_amount": "Monto Neto",
    "manage_all": "Gestionar Todo",
    "bestsellers": "Bestsellers",
    "strategy_2024": "Estrategia 2024",
    "explore_partners": "Explorar Partners",

    // Invoices / Sales List
    "sales_income": "Ventas e Ingresos",
    "business_intelligence": "Inteligencia de Negocio Maria's Dog Corner",
    "register_operation": "Registrar Operación",
    "total_income": "Ingresos Totales",
    "transactions": "Transacciones",
    "avg_ticket": "Ticket Promedio",
    "per_client": "Por cliente",
    "collection_rate": "Tasa de Cobro",
    "paid_invoices": "Facturas pagadas",
    "income_trend": "Tendencia de Ingresos",
    "distribution_channel": "Canal de Distribución",
    "search_placeholder": "Buscar por cliente, folio o referencia...",
    "no_records": "No se han encontrado registros en este periodo",

    // Invoice Builder
    "billing_registration": "Registro de Facturación",
    "client_info": "Información del Cliente",
    "search_member": "Buscar Miembro",
    "retail": "Retail",
    "wholesale": "Wholesale",
    "assign_client_first": "Asigna un cliente primero.",
    "client_business": "Cliente / Negocio",
    "contact_email": "Correo de contacto",
    "services_products": "Servicios y Productos",
    "description": "Descripción",
    "quantity": "Cant",
    "unit_price": "Precio Unit.",
    "amount": "Monto",
    "new_line": "Nueva línea",
    "quick_snacks": "Snacks Rápidos",
    "print_pdf": "Imprimir PDF",
    "generate_invoice": "Generar Factura",
    "pay_with_card": "Pagar con Tarjeta",
    "stripe_secure": "Seguro vía Stripe",

    // Reports
    "accounting": "Contabilidad",
    "hmrc_compliance": "Cumplimiento HMRC",
    "pl_statement": "Estado de P&G",
    "export_report": "Exportar Reporte",
    "tax_provision": "Provisión Fiscal Estimada",
    "real_result": "Resultado Real (Post-Tax)",

    // Clients
    "client_portfolio": "Cartera de Clientes",
    "directory_desc": "Directorio de Partners y Clientes Finales",
    "new_member": "Nuevo Miembro",
    "search_clients": "Buscar por nombre o correo...",
    "name": "Nombre",
    "b2b_partner": "Partner B2B",
    "particular": "Cliente Retail",
    "back_to_list": "Volver al listado",
    "historic_spend": "Gasto Histórico",
    "last_operation": "Última Operación",

    // Inventory
    "stock_management": "Gestión de Stock",
    "traceability_desc": "Monitorización de caducidad y trazabilidad de lotes UK.",
    "new_batch": "Registrar Nuevo Lote",
    "inventory_general": "Inventario General & Insumos",
    "product_batch": "Producto / Batch ID",
    "stock_level": "Nivel Stock",
    "critical_stock": "Stock Crítico",
    "expired": "CADUCADO",
    "food_safety": "Estándares UK Food Safety",
    "sync_stock": "Sincronizar Stock",
    "total_value": "Valor Total Almacén",

    // Expenses
    "expense_control": "Control de Gastos",
    "register_expense": "Registrar Gasto",
    "net_losses": "Pérdidas Netas",
    "expense_registry": "Registro Maestro de Egresos",

    // Settings
    "core_settings_title": "Ajustes Core",
    "integrity_desc": "Centro de integridad operativa y cumplimiento Maria's Dog Corner.",
    "business_bacs": "Negocio & BACS",
    "integrations": "Integraciones",
    "audit_center": "Centro de Auditoría",
    "bacs_title": "Datos para Transferencia BACS",
    "beneficiary": "Beneficiario",
    "payment_infra": "Infraestructura de Pagos",
    "audit_trail": "Audit Trail",
    "operative_sop": "Protocolos Operativos (SOP)",
    "health_diagnostic": "Diagnóstico de Salud Operativa",
    "download_master": "Descargar Maestro de Datos",

    // Distributor Landing
    "grow_with_mdc": "Crece con MDC",
    "official_partner": "Programa de Partners Oficial 2024",
    "join_network": "Únete a nuestra red exclusiva de distribuidores en el Reino Unido y ofrece snacks gourmet 100% naturales.",
    "distributor_access": "Acceso Distribuidor",
    "view_benefits": "Ver Beneficios",
    "loyalty_program": "Programa de Fidelidad & Niveles",
    "scale_desc": "Escala tu negocio y desbloquea descuentos progresivos.",
    "units_month": "Unidades/Mes",
    "discount": "Descuento",
    "natural_snacks": "Snacks 100% Naturales",
    "no_additives": "Sin Aditivos",
    "uk_sourced": "UK Sourced",
    "ready_partner": "¿Listo para ser un Partner MDC?",
    "request_access": "Solicitar Acceso Ahora",

    // Distributor Portal
    "distributor_panel": "Panel de Distribuidor",
    "certified_partner": "Partner Certificado",
    "place_order": "Realizar Pedido",
    "distributor_tier": "Nivel de Distribuidor",
    "accumulated_points": "Puntos Acumulados",
    "monthly_purchases": "Compras del Mes",
    "profit_margin": "Margen de Ganancia",
    "earned_margin": "Ganancia Estimada",

    // Distributor Catalog
    "catalog_b2b": "Catálogo B2B",
    "partner_price": "Precios exclusivos para partners. Suministro gourmet premium.",
    "min_order": "Mínimo 6 unidades (Faltan {0})",
    "pay_stripe": "Pagar vía Stripe Secure",
    "order_completed": "¡Pedido Completado!",
    "transaction_processed": "Transacción procesada vía Stripe. Tu stock ha sido reservado.",
    "profit_per_unit": "Ganancia/unidad",

    // Login
    "login_platform": "Plataforma de Gestión B2B & Minorista",
    "user_label": "Usuario (admin / distribuidor)",
    "access_key": "Clave de Acceso",
    "enter_ecosystem": "Entrar al Ecosistema",
    "want_be_distributor": "Quiero ser Distribuidor",
    "encrypted_system": "Sistema Cifrado de MDC",

    // Messages Page
    "internal_chat_title": "Mensajería Interna",
    "customer_info": "Información del Cliente",
    "online": "En línea",
    "msg_history": "Historial de Ventas"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('mdc_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mdc_lang', lang);
  };

  const t = (key: string) => {
    const translation = translations[language][key as keyof typeof translations['en']];
    if (!translation) return key;
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
