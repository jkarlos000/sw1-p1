import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OptionsQR {
  public viewElement = signal<boolean>(false);
}
