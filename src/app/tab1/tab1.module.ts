import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab1Page } from './tab1.page';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
import { BeerIndicatorComponent } from './beer-indicator/beer-indicator.component';

@NgModule({
    imports: [
        IonicModule,
        CommonModule,
        FormsModule,
        RouterModule.forChild([{path: '', component: Tab1Page}]),
    ],
    declarations: [Tab1Page, BeerIndicatorComponent],
    providers: [BluetoothLE],
})
export class Tab1PageModule {
}
