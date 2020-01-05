import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
})
export class Tab2Page {
    pairedList: Pairedlist[];
    pairedDeviceID = 0;
    dataSend = '';

    constructor(private alertCtrl: AlertController, private toastCtrl: ToastController, private bluetoothSerial: BluetoothSerial) {
        this.checkBluetoothEnabled();
    }

    checkBluetoothEnabled() {
        this.bluetoothSerial.isEnabled().then(success => {
            this.showToast('Listing devices...');
            this.listPairedDevices();
        }, error => {
            this.showError('Please Enable Bluetooth');
        });
    }

    listPairedDevices() {
        this.bluetoothSerial.available()
            .then(() => {
                this.bluetoothSerial.read()
                    .then((data: any) => {
                        console.log(data);
                    });
            });

        this.bluetoothSerial.list().then(list => {
            console.log({list});
            this.pairedList = list;
        }, error => {
            this.showError('Please Enable Bluetooth');
            this.pairedList = [];
        });
    }

    selectDevice() {
        const connectedDevice = this.pairedList[this.pairedDeviceID];
        console.log(connectedDevice);

        if (!connectedDevice.address) {
            this.showError('Select Paired Device to connect');
            return;
        }

        const address = connectedDevice.address;
        const name = connectedDevice.name;

        this.connect(address);
    }

    connect(address) {
        console.log('trying to connect...');
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothSerial.connect(address).subscribe(success => {
            this.showToast('Connected: ' + success.status);
            this.deviceConnected();
        }, error => {
            this.showError('Error:Connecting to Device');
        });
    }

    deviceConnected() {
        // Subscribe to data receiving as soon as the delimiter is read
        this.bluetoothSerial.subscribe('\n')
            .subscribe(data => {
                this.handleData(data);
                this.showToast(`Successfully subscribed to [${this.pairedList[this.pairedDeviceID].name}]`);
            }, error => {
                this.showError(error);
            });
    }

    deviceDisconnected() {
        // Unsubscribe from data receiving
        this.bluetoothSerial.disconnect();
        this.showToast('Device disconnected');
    }

    handleData(data) {
        this.showToast(data);
    }

    sendData() {
        this.dataSend += '\n';
        this.showToast(this.dataSend);

        this.bluetoothSerial.write(this.dataSend)
            .then(success => {
                this.showToast(success);
            }, error => {
                this.showError(error);
            });
    }

    private async showToast(message: string): Promise<void> {
        const toast = await this.toastCtrl.create({
            color: 'dark',
            message,
            duration: 3000,
        });
        return toast.present();
    }

    private async showError(message: string): Promise<void> {
        const toast = await this.toastCtrl.create({
            color: 'danger',
            message,
            showCloseButton: true,
        });
        return toast.present();
    }

}

interface Pairedlist {
    'class': number;
    'id': string;
    'address': string;
    'name': string;
}
