import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: any;
  isAdmin: boolean = false;
  selectedTab: string = 'profile';
  adminTab: string = 'list'; 
  users: any[] = [];

  newUser = { fullName: '', username: '', email: '', password: '', role: '' };
  editUser: any = null;
  searchEmail: string = '';

  constructor(private databaseService: DatabaseService, private router: Router) {}

  async ngOnInit() {
    this.user = await this.databaseService.getCurrentUser();
  
    if (this.user?.role) {
      if (await this.databaseService.verifyUserRole('admin', this.user.role)) {
        this.user.role = 'admin';
      } else if (await this.databaseService.verifyUserRole('user', this.user.role)) {
        this.user.role = 'user';
      } else {
        this.user.role = 'Desconocido';
      }
    }
  
    this.isAdmin = this.user?.role === 'admin';
  
    if (this.isAdmin) {
      this.users = await this.databaseService.getAllUsers();
      
      for (const user of this.users) {
        if (user.role) {
          if (await this.databaseService.verifyUserRole('admin', user.role)) {
            user.role = 'admin';
          } else if (await this.databaseService.verifyUserRole('user', user.role)) {
            user.role = 'user';
          } else {
            user.role = 'Desconocido';
          }
        }
      }
    }
  }
  
  async addUser() {
    if (!this.newUser.fullName || !this.newUser.email || !this.newUser.password || !this.newUser.role) {
      alert('Todos los campos son obligatorios');
      return;
    }
  
    await this.databaseService.addUser(
      this.newUser.email,
      this.newUser.fullName,
      this.newUser.username,
      this.newUser.password,
      this.newUser.role
    );
  
    this.users = await this.databaseService.getAllUsers();
    this.newUser = { fullName: '', email: '', username: '', password: '', role: '' };
  }
  
  async deleteUser(id: string) {
    await this.databaseService.deleteUser(id);
    this.users = await this.databaseService.getAllUsers();
  }  

  async searchUser() {
    if (!this.searchEmail) {
      alert('Ingrese un email para buscar.');
      return;
    }

    this.editUser = await this.databaseService.getUserByEmail(this.searchEmail);
    if (this.editUser) {
      this.editUser.fullName = this.editUser.fullName || '';
      this.editUser.username = this.editUser.username || '';
    }
    
  }
  

  async updateUser() {
    if (!this.editUser) {
      alert('Debe buscar un usuario antes de actualizar.');
      return;
    }
    await this.databaseService.updateUser(this.editUser);
    this.users = await this.databaseService.getAllUsers();
    this.editUser = null; // Limpiar el formulario
  }
  
  logout() {
    this.databaseService.logout();
    this.user = null; // Limpiar datos del usuario
    this.router.navigate(['/login']);
  }
}
