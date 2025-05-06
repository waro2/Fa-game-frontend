import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Composants
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({


    imports: [
        LoginComponent,
        RegisterComponent,
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forChild([
            { path: 'login', component: LoginComponent },
            { path: 'register', component: RegisterComponent }
        ]),
        // Angular Material

    ]
})
export class AuthModule { }