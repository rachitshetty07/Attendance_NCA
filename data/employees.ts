export interface Employee {
    id: number;
    name: string;
    email: string;
    role: 'manager' | 'article';
}

export const employees: Employee[] = [
    { id: 41, name: "Rachith C.N.", email: "rachith@rcn-audit.com", role: 'manager' },
    { id: 1, name: "Vamshi", email: "vamshi.rcn@gmail.com", role: 'article' },
    { id: 2, name: "Kadeeja Ali", email: "kadeejaali.rcn@gmail.com", role: 'article' },
    { id: 3, name: "Ananya", email: "ananya.rcn@gmail.com", role: 'article' },
    { id: 4, name: "Jibin", email: "jibin.rcn@gmail.com", role: 'article' },
    { id: 5, name: "Devadathma", email: "devadathmanoj.rcn@gmail.com", role: 'article' },
    { id: 6, name: "V. Devika", email: "vdevika.rcn@gmail.com", role: 'article' }
];