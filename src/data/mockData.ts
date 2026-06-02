export interface Ticket {
    id: string;
    number: string;
    title: string;
    company: string;
    time: string;
    status: string;
    assignee?: {
        name: string;
        avatar?: string;
        initials?: string;
        type?: string;
    };
    urgent?: boolean;
    messages?: number;
    description?: string;
}

export const TICKETS: Ticket[] = [
    {
        id: '1',
        number: '#864',
        title: 'Servicio Técnico AGQ Colombia S.A.S. PG-350...',
        company: 'AGQ Colombia S.A.S.',
        time: '25 Ene 03:44 PM',
        status: 'INGRESADO',
        assignee: {
            name: 'Mauricio Esterling Tovar',
            initials: 'LÁ'
        },
        urgent: true
    },
    {
        id: '2',
        number: '#884',
        title: 'Servicio Técnico PSL Proanalisis S.A.S. BIC...',
        company: 'PSL Proanalisis S.A.S. BIC',
        time: 'hace 15 horas',
        status: 'INGRESADO',
        assignee: {
            name: 'David León',
            avatar: 'https://lh3.googleusercontent.com/a/ACg8ocL8_Q3yG0_T_9q-_r_J_E_z_m_8_e_4'
        }
    },
    {
        id: '3',
        number: '#879',
        title: 'Servicio Técnico Chemical Laboratory S.A.S. -...',
        company: 'Chemical Laboratory S.A.S. - CHEMILAB S....',
        time: 'hace un día',
        status: 'INGRESADO',
        assignee: {
            name: 'Sandra Paola Useche Martínez',
            initials: ''
        }
    },
    {
        id: '4',
        number: '#876',
        title: 'Servicio Técnico Chemical Laboratory S.A.S. -...',
        company: 'Chemical Laboratory S.A.S. - CHEMILAB S....',
        time: '16 Feb',
        status: 'COMERCIAL',
        assignee: {
            name: 'Sandra Paola Useche Martínez',
            initials: ''
        }
    },
    {
        id: '5',
        number: '#861',
        title: 'Servicio Técnico Ambienciq Ingenieros...',
        company: 'Ambienciq Ingenieros S.A.S.',
        time: '16 Ene',
        status: 'PROCESO',
        assignee: {
            name: 'Benoit Lukasz',
            initials: ''
        }
    },
    {
        id: '6',
        number: '#859',
        title: 'Servicio Técnico Servicios de Ingeniería y Ambiente...',
        company: 'Servicios de Ingeniería y Ambiente S.A....',
        time: '09 Ene',
        status: 'PROCESO',
        assignee: {
            name: 'Jeffy Rodriguez',
            initials: ''
        },
        messages: 1
    },
    {
        id: '7',
        number: '#871',
        title: 'Servicio Técnico Corola Ambiental S.A.S. Monitor...',
        company: 'Corola Ambiental S.A.S.',
        time: '16 Feb',
        status: 'NOTIFICACION_CLIENTE',
        assignee: {
            name: 'Mario Ávila',
            initials: ''
        }
    },
    {
        id: '8',
        number: '#866',
        title: 'Servicio Técnico Servicios Geológicos Integrados...',
        company: 'Servicios Geológicos Integrados S.A.S...',
        time: '04 Feb',
        status: 'POR_FACTURAR',
        assignee: {
            name: 'Fabián Herrera',
            initials: ''
        },
        messages: 1
    },
    {
        id: '9',
        number: '#838',
        title: 'Servicio Técnico Servicios de Ingeniería y Ambiente S.A.S...',
        company: 'Servicios de Ingeniería y Ambiente S.A.S...',
        time: '22 Ene',
        status: 'POR_ENTREGAR_SIN_FACTURAR',
        assignee: {
            name: 'Yordan Pardo',
            initials: ''
        }
    },
    {
        id: '10',
        number: '#862',
        title: 'Servicio Técnico Ambienciq Ingenieros S.A.S. Analizador...',
        company: 'Ambienciq Ingenieros S.A.S.',
        time: '16 Ene',
        status: 'POR_ENTREGAR',
        assignee: {
            name: 'Benoit Lukasz',
            initials: ''
        }
    },
    {
        id: '11',
        number: '#867',
        title: 'Servicio Técnico Servicios Geológicos Integrados S.A.S...',
        company: 'Servicios Geológicos Integrados S.A.S...',
        time: '13 Feb',
        status: 'ESPERA_REPUESTOS',
        assignee: {
            name: 'Fabián Herrera',
            initials: ''
        }
    }
];

export const NAVIGATION_ITEMS = [
    { id: '1', label: 'Oficina Principal', icon: 'home' },
    { id: '2', label: 'Comentarios Del Equipo', icon: 'chat' },
    { id: '3', label: 'Vistas', icon: 'folder' }
];

export const VIEWS = [
    { id: 'all', label: 'Todos los Tickets', active: true },
    { id: 'closed', label: 'Tickets cerrados' },
    { id: 'responded', label: 'Tickets respondidos p...' },
    { id: 'chats', label: 'Chats perdidos' },
    { id: 'mine', label: 'Mis Tickets' },
    { id: 'mine_waiting', label: 'Mis Tickets en espera' },
    { id: 'mine_open', label: 'Mis Tickets abiertos' },
    { id: 'mine_expired', label: 'Mis Tickets vencidos' }
];

export const TABS = [
    { id: 'ingresado', label: 'Ingresado', status: 'INGRESADO', count: 11 },
    { id: 'comercial', label: 'Notificación Comercial', status: 'COMERCIAL', count: 1 },
    { id: 'proceso', label: 'En Proceso', status: 'PROCESO', count: 7 },
    { id: 'notif_cliente', label: 'Notificación cliente', status: 'NOTIFICACION_CLIENTE', count: 6 },
    { id: 'por_facturar', label: 'Por Facturar', status: 'POR_FACTURAR', count: 4 },
    { id: 'entregar_sin_facturar', label: 'Por Entregar / Sin facturar', status: 'POR_ENTREGAR_SIN_FACTURAR', count: 1 },
    { id: 'por_entregar', label: 'Por Entregar', status: 'POR_ENTREGAR', count: 1 },
    { id: 'espera_repuestos', label: 'En Espera de Repuestos', status: 'ESPERA_REPUESTOS', count: 7 }
];
