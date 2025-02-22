import { Injectable } from '@angular/core';
import { Database, ref, set, push, update, get, remove } from '@angular/fire/database';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor(private db: Database) {}

  // Manejo de token y sesión
  saveToken(token: string) {
    localStorage.setItem('userToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('userToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null;
  }

  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
  }

  // Registro de usuario
  async addUser(email: string, fullName: string, username: string, password: string, role: string) {
      const hashedPassword = await bcrypt.hash(password, 10);
    const hashedRole = await bcrypt.hash(role, 5);
    const userRef = push(ref(this.db, 'users'));
    return set(userRef, {
      email,
      fullName,  
      username,
      password: hashedPassword,
      role: hashedRole
    });
  }

  // Genera un token en base64 con información del usuario
  generateToken(user: any): string {
    const payload = {
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      timestamp: new Date().getTime()
    };
    return btoa(JSON.stringify(payload));
  }

  // Login de usuario: valida credenciales, actualiza last_login y guarda el usuario actual en localStorage
  async loginUser(email: string, password: string) {
    try {
      const usersRef = ref(this.db, 'users');
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        throw new Error('Correo o contraseña incorrectos');
      }

      const users = snapshot.val();
      let userFound = null;

      for (const key in users) {
        if (users[key].email === email) {
          userFound = { id: key, ...users[key] };
          break;
        }
      }

      if (!userFound) {
        throw new Error('Correo o contraseña incorrectos');
      }

      const passwordMatch = await bcrypt.compare(password, userFound.password);
      if (!passwordMatch) {
        throw new Error('Correo o contraseña incorrectos');
      }

      const timestamp = Date.now();
      await update(ref(this.db, `users/${userFound.id}`), { last_login: timestamp });
      userFound.last_login = timestamp;
      localStorage.setItem('currentUser', JSON.stringify(userFound));

      return userFound;
    } catch (error) {
      console.error('Error en loginUser:', error);
      throw error;
    }
  }

  // Devuelve el usuario actual almacenado en localStorage
  async getCurrentUser(): Promise<any> {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  // Obtiene todos los usuarios desde Firebase y los retorna como un arreglo
  async getAllUsers(): Promise<any[]> {
    const usersRef = ref(this.db, 'users');
    const snapshot = await get(usersRef);
    const usersArray: any[] = [];
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      for (const key in usersObj) {
        usersArray.push({ id: key, ...usersObj[key] });
      }
    }
    return usersArray;
  }

  // Elimina un usuario dado su ID
  async deleteUser(id: string): Promise<void> {
    await remove(ref(this.db, `users/${id}`));
  }

  // Actualiza la información de un usuario (se espera que el objeto "user" incluya su propiedad "id")
  async updateUser(user: any): Promise<void> {
    const { id, ...userData } = user;
    await update(ref(this.db, `users/${id}`), userData);
  }

  // Busca y retorna un usuario por email (retorna null si no lo encuentra)
  async getUserByEmail(email: string): Promise<any> {
    const usersRef = ref(this.db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return null;
    const users = snapshot.val();
    for (const key in users) {
      if (users[key].email === email) {
        return { id: key, ...users[key] };
      }
    }
    return null;
  }
  async verifyUserRole(userRole: string, hashedRole: string): Promise<boolean> {
    return await bcrypt.compare(userRole, hashedRole);
  }
  
}
