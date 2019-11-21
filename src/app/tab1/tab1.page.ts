import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { AlertController, ToastController } from '@ionic/angular';

interface PairedList {
    class: number;
    id: string;
    address: string;
    name: string;
}

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
})
export class Tab1Page {
    listToggle: boolean;
    pairedList: PairedList;

    pairedDeviceID = 0;
    dataSend = '';

    constructor(private toast: ToastController,
                private bluetoothSerial: BluetoothSerial,
                private alertCtrl: AlertController) {
        this.checkBluetoothEnabled();
    }

    checkBluetoothEnabled() {
        this.bluetoothSerial.isEnabled().then(success => {
            this.listPairedDevices();
        }, error => {
            console.log(error);
            this.showError('Enable Bluetooth, hoe!');
        });
    }

    private listPairedDevices() {
        this.bluetoothSerial.list()
            .then(success => {
                this.pairedList = success;
                this.listToggle = true;
            }, error => {
                this.showError('Enable Bluetooth, hoe!');
                this.listToggle = false;
            });
    }

    selectDevice() {
        const connectedDevice = this.pairedList[this.pairedDeviceID];
        if (!connectedDevice.address) {
            this.showError('Select Paired Device to connect');
            return;
        }
        const address = connectedDevice.address;
        const name = connectedDevice.name;

        this.connect(address);
    }

    connect(address) {
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothSerial.connect(address).subscribe(success => {
            this.deviceConnected();
            this.showToast('Successfully connected!');
        }, error => {
            this.showError('Error:Connecting to Device');
        });
    }

    deviceConnected() {
        // Subscribe to data receiving as soon as the delimiter is read
        this.bluetoothSerial.subscribe('\n')
            .subscribe(success => {
                this.handleData(success);
                this.showToast('Connected Device successfullly!');
            }, error => {
                this.showError(error);
            });
    }

    deviceDisconnected() {
        // Unsubscribe from data receiving
        this.bluetoothSerial.disconnect();
        this.showToast('Device Disconnected');
    }

    handleData(data) {
        this.showToast(data);
    }

    sendData() {
        this.dataSend += '\n';
        this.showToast(this.dataSend);

        this.bluetoothSerial.write(this.dataSend).then(success => {
            this.showToast(success);
        }, error => {
            this.showError(error);
        });
    }

    private async showToast(message: string): Promise<void> {
        const toast = await this.toast.create({
            message,
            duration: 1000,
        });
        return toast.present();
    }

    private async showError(message: string): Promise<void> {
        const alert = await this.alertCtrl.create({
            message,
            buttons: ['Dismiss'],
        });
        return alert.present();
    }
}
