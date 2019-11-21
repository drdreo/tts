import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent {
    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        public bluetoothle: BluetoothLE,
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then((readySource) => {
            console.log('Platform ready from ', readySource);
            const params: object = {
                request: true,
                statusReceiver: false,
                restoreKey: 'bluetoothleplugin',
            };

            this.bluetoothle.initialize(params).subscribe(ble => {
                console.log('ble', ble.status); // logs 'enabled'
            });
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });
    }
}
