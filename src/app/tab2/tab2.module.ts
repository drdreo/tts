import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab2Page } from './tab2.page';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { TableButtonComponent } from './table-button/table-button.component';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab2Page}]),
    ],
    declarations: [Tab2Page, TableButtonComponent],
    providers: [BluetoothSerial],
})
export class Tab2PageModule {
}
