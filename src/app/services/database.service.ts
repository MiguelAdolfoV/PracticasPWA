import { Injectable } from '@angular/core';
import { Database, ref, set, push, update, get } from '@angular/fire/database';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor(private db: Database) {}

  async addUser(email: string, username: string, password: string, role: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const hashedRole = await bcrypt.hash(role, 5);

    const userRef = push(ref(this.db, 'users'));

    return set(userRef, {
      email,
      username,
      password: hashedPassword,
      role: hashedRole
    });
  }
  
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

      return userFound; // Devuelve el usuario autenticado

    } catch (error) {
      console.error('Error en loginUser:', error);
      throw error;
    }
  }
}
