import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  BrowserMultiFormatReader,
  NotFoundException,
  Result,
} from '@zxing/library';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  AuthService,
  SalaDiagrama,
  StatusAuth,
  UserAuth,
} from './auth.service';
export enum ViewTypeForm {
  login,
  register,
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export default class AuthComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('modalCustomHTML') modalCustomHTML: ElementRef;
  onListenRespUnirseReunion!: Subscription;
  onListenRespNuevaReunion!: Subscription;
  public serviceAuth = inject(AuthService);
  public formBuilder = inject(FormBuilder);
  public router = inject(Router);
  public viewFormAuth = signal<boolean>(false);
  public infoDate = signal<Date>(new Date());
  public viewFormLogin = signal<boolean>(false);
  // READ : INPUT CODIGO SALA
  public inputCodigoSala: string = '';
  // READ : PROPIEDADES DEL MODAL
  public modalCustomView = signal<boolean>(false);
  public messageModalCustom = signal<string>('');
  private codeReader = new BrowserMultiFormatReader();

  // READ : FORMULARIO LOGIN
  public myFormLogin: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  // READ : FORMULARIO REGISTER
  public myFormRegister: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
    passwordConfirm: ['', [Validators.required]],
  });

  ngOnInit(): void {
    setInterval(() => this.infoDate.update(() => new Date()), 1000);
    //LOGIC: VERIFICAR SI EXISTE INFORMACION DEL USUARIO EN EL LOCALSTORAGE
    const userAuth = localStorage.getItem('userAuth');
    if (userAuth) {
      this.serviceAuth.setUserAuth(JSON.parse(userAuth));
      this.serviceAuth.setStatusClient(StatusAuth.Autenticado);
    }

    // READ: EVENTOS DE ESCUCHA
    this.onListenRespUnirseReunion = this.serviceAuth
      .onListenRespUnirseReunion()
      .subscribe((data: any) => {
        console.log('Respuesta unirse-reunion:', data);
        // LOGIC : Verificar que los datos tengan el formato esperado
        if (!data.ok || !data.sala) {
          this.messageModalCustom.set('Error al unirse a la sala de reunión');
          this.modalCustomView.set(true);
          return;
        }
        let salaDiagrama: SalaDiagrama = {
          id: data.sala.id,
          nombre: data.sala.nombre,
          host: data.sala.host,
        };
        console.log('Sala configurada:', salaDiagrama);
        this.serviceAuth.setSalaDiagrama(salaDiagrama);
        // LOGIC : REDIRECCIONAR A LA SALA DE REUNION
        this.router.navigate(['/diagramador', data.sala.nombre]);
      });

    this.onListenRespNuevaReunion = this.serviceAuth
      .onListenRespNuevaReunion()
      .subscribe((data: any) => {
        console.log('Respuesta nueva-reunion:', data);
        // LOGIC : Verificar que los datos tengan el formato esperado
        if (!data.ok || !data.sala) {
          this.messageModalCustom.set('Error al crear la sala de reunión');
          this.modalCustomView.set(true);
          return;
        }
        let salaDiagrama: SalaDiagrama = {
          id: data.sala.id,
          nombre: data.sala.nombre,
          host: data.sala.host,
        };
        console.log('Sala configurada:', salaDiagrama);
        this.serviceAuth.setSalaDiagrama(salaDiagrama);
        // LOGIC : REDIRECCIONAR A LA SALA DE REUNION
        this.router.navigate(['/diagramador', data.sala.nombre]);
      });
  }

  ngAfterViewInit(): void {
    this.modalCustomHTML.nativeElement.addEventListener(
      'click',
      this.cerrarModal.bind(this)
    );
  }

  ngOnDestroy(): void {
    this.modalCustomHTML.nativeElement.removeEventListener(
      'click',
      this.cerrarModal.bind(this)
    );
    this.onListenRespUnirseReunion.unsubscribe();
    this.onListenRespNuevaReunion.unsubscribe();
  }

  updateViewFormAuth(): void {
    this.viewFormAuth.set(!this.viewFormAuth());
  }

  changedViewFormLogin(): void {
    this.viewFormLogin.set(!this.viewFormLogin());
  }

  getStatusAuth(): StatusAuth {
    return this.serviceAuth.getStatusClient();
  }

  isAuthenticado(): boolean {
    return this.serviceAuth.getStatusClient() == StatusAuth.Autenticado;
  }

  procesoLogin(): void {
    const { email, password } = this.myFormLogin.value;
    if (this.myFormLogin.valid) {
      this.serviceAuth.procesoLogin(email, password).subscribe(
        (response: UserAuth) => {
          this.serviceAuth.setUserAuth(response);
          this.serviceAuth.setStatusClient(StatusAuth.Autenticado);
          this.myFormLogin.reset();
          //LOGIC: GUARDAR INFORMACION DEL USER EN EL LOCALSTORAGE
          localStorage.setItem('userAuth', JSON.stringify(response));
        },
        (dataError) => {
          console.log(dataError);
          this.messageModalCustom.set(
            'Revise sus credenciales para iniciar sesión'
          );
          this.modalCustomView.set(true);
        }
      );
    } else {
      this.messageModalCustom.set(
        'Revise sus credenciales para iniciar sesión'
      );
      this.modalCustomView.set(true);
    }
  }

  procesoRegistro(): void {
    const { email, password, passwordConfirm } = this.myFormRegister.value;
    if (password != passwordConfirm) {
      this.messageModalCustom.set('Las contraseñas no coinciden');
      this.modalCustomView.set(true);
      return;
    }

    if (this.myFormRegister.valid) {
      this.serviceAuth.procesoRegistro(email, password).subscribe(
        (response: UserAuth) => {
          this.serviceAuth.setUserAuth(response);
          this.serviceAuth.setStatusClient(StatusAuth.Autenticado);
          this.myFormRegister.reset();
          //LOGIC: GUARDAR INFORMACION DEL USER EN EL LOCALSTORAGE
          localStorage.setItem('userAuth', JSON.stringify(response));
        },
        (dataError) => {
          console.log(dataError);
          this.messageModalCustom.set(
            'Revise el formulario de registro e intente nuevamente'
          );
          this.modalCustomView.set(true);
        }
      );
    } else {
      this.messageModalCustom.set(
        'Revise el formulario de registro e intente nuevamente'
      );
      this.modalCustomView.set(true);
    }
  }

  cerrarSesion(): void {
    this.serviceAuth.cerrarSesion();
    //LOGIC : ELIMINAR INFORMACION USER DEL LOCALSTORAGE
    localStorage.removeItem('userAuth');
  }

  newReunion(): void {
    if (!this.isAuthenticado()) return;
  }

  unirmReunion(): void {
    if (!this.isAuthenticado()) return;
  }

  cerrarModal(event: any): void {
    if (event.target == this.modalCustomHTML.nativeElement) {
      this.modalCustomView.set(false);
    }
  }

  emitNuevaReunion(): void {
    const salaNueva = uuidv4().substring(0, 6);
    this.serviceAuth.emitNuevaReunion(
      this.serviceAuth.getUserAuth()!.id,
      salaNueva
    );
  }

  emitUnirseReunion(): void {
    if (this.inputCodigoSala == '') {
      this.messageModalCustom.set('Ingrese un código de sala válido');
      this.modalCustomView.set(true);
      return;
    }

    this.serviceAuth.emitUnirseReunion(
      this.serviceAuth.getUserAuth()!.id,
      this.inputCodigoSala
    );
  }

  leerQRSala(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const imageSrc = e.target.result;
        this.codeReader
          .decodeFromImage(undefined, imageSrc)
          .then((result: Result) => {
            const qrText = result.getText();
            console.log('QR Code Result:', qrText);
            this.serviceAuth.emitUnirseReunion(
              this.serviceAuth.getUserAuth()!.id,
              qrText
            );
          })
          .catch((err) => {
            if (err instanceof NotFoundException) {
              console.error('No QR code found.');
            } else {
              console.error('Error reading QR code:', err);
            }
          });
      };
      reader.readAsDataURL(file);
    }
  }
}
