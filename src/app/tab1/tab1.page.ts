import { Component, OnDestroy } from '@angular/core';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
import { AlertController, ToastController } from '@ionic/angular';
import { scan, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface PairedList {
    class: number;
    id: string;
    address: string;
    name: string;
}

interface Device {
    name: string;
    address: string;
}


const mockDevices = [{
    status: 'scanResult',
    advertisement: {solicitedServiceUuids: [], overflowServiceUuids: [], isConnectable: 1, serviceData: {}, serviceUuids: []},
    rssi: -37,
    name: 'Andreass MacBook',
    address: '9857ED81-0A13-B68C-A0C2-FF6028D40A0F',
},
    {
        status: 'scanResult',
        advertisement: {
            solicitedServiceUuids: [],
            overflowServiceUuids: [],
            isConnectable: 1,
            serviceData: {},
            serviceUuids: [],
        },
        rssi: -36,
        name: null,
        address: 'D47A81E8-C43F-B2D2-B644-6D5795C26570',
    },
    {
        status: 'scanResult',
        advertisement: {
            solicitedServiceUuids: [],
            overflowServiceUuids: [],
            localName: 'Tile',
            isConnectable: 1,
            serviceData: {},
            serviceUuids: ['FEED'],
        },
        rssi: -69,
        name: 'Tile',
        address: '26D35CC9-8B69-AA73-3893-BAB471686CB8',
    },
    {
        status: 'scanResult',
        advertisement: {
            solicitedServiceUuids: [],
            overflowServiceUuids: [],
            localName: 'Tile',
            isConnectable: 1,
            serviceData: {FEED: 'AgBUv0z0uWeM1A=='},
            serviceUuids: ['FEED'],
        },
        rssi: -77,
        name: 'Tile',
        address: 'C7E03B6D-81F3-2E05-C95F-B8F73AAF62AA',
    },
    {
        status: 'scanResult',
        advertisement: {
            solicitedServiceUuids: [],
            overflowServiceUuids: [],
            localName: 'Tile',
            isConnectable: 1,
            serviceData: {},
            serviceUuids: ['FEED'],
        },
        rssi: -78,
        name: 'Tile',
        address: '9F9B3D50-82E9-B118-2082-0E3D0ED6F081',
    }];

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnDestroy {
    listToggle: boolean;
    pairedList: PairedList;
    pairableDevices: Device[] = mockDevices;

    pairedDeviceID = '';
    dataSend = '';


    private unsubscribe$ = new Subject();

    constructor(private toast: ToastController,
                private alertCtrl: AlertController,
                public bluetoothle: BluetoothLE) {
        // this.checkBluetoothEnabled();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    scanDevices() {
        const scanParams = {};

        this.bluetoothle.startScan(scanParams)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((scanStatus) => {
                console.log(scanStatus);
                this.pairableDevices.push({name: scanStatus.name, address: scanStatus.address});
            }, (error) => {
                this.showError(error);
            });

        // auto stop scanning after 5s
        setTimeout(() => {
            this.bluetoothle.stopScan();
        }, 5000);
    }

    selectDevice() {
        if (!this.pairedDeviceID.length) {
            this.showError('Select pairable device to connect');
            return;
        }

        const address = this.pairedDeviceID;
        // const device = this.pairableDevices.find(device => address === device.address);
        //
        // const address = device.address;
        // const name = device.name;

        this.connect(address);
    }

    connect(address) {
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothle.connect({address})
            .subscribe((res) => {
                this.showToast(`Successfully connected to ${res.name}!`);
            }, error => {
                console.log(error);
                this.showError('Error:Connecting to Device');
            });
    }

    // checkBluetoothEnabled() {
    //     this.bluetoothSerial.isEnabled().then(success => {
    //         this.listPairedDevices();
    //     }, error => {
    //         console.log(error);
    //         this.showError('Enable Bluetooth, hoe!');
    //     });
    // }
    //
    // private listPairedDevices() {
    //     this.bluetoothSerial.list()
    //         .then(list => {
    //             this.pairedList = list;
    //             this.listToggle = true;
    //         }, error => {
    //             this.showError('Enable Bluetooth, hoe!');
    //             this.listToggle = false;
    //         });
    // }
    //
    // selectDevice() {
    //     const connectedDevice = this.pairedList[this.pairedDeviceID];
    //     if (!connectedDevice.address) {
    //         this.showError('Select Paired Device to connect');
    //         return;
    //     }
    //     const address = connectedDevice.address;
    //     const name = connectedDevice.name;
    //
    //     this.connect(address);
    // }
    //
    // connect(address) {
    //     // Attempt to connect device with specified address, call app.deviceConnected if success
    //     this.bluetoothSerial.connect(address).subscribe(success => {
    //         this.deviceConnected();
    //         this.showToast('Successfully connected!');
    //     }, error => {
    //         this.showError('Error:Connecting to Device');
    //     });
    // }
    //
    // deviceConnected() {
    //     // Subscribe to data receiving as soon as the delimiter is read
    //     this.bluetoothSerial.subscribe('\n')
    //         .subscribe(success => {
    //             this.handleData(success);
    //             this.showToast('Connected Device successfullly!');
    //         }, error => {
    //             this.showError(error);
    //         });
    // }
    //
    // deviceDisconnected() {
    //     // Unsubscribe from data receiving
    //     this.bluetoothSerial.disconnect();
    //     this.showToast('Device Disconnected');
    // }
    //
    // handleData(data) {
    //     this.showToast(data);
    // }
    //
    // sendData() {
    //     this.dataSend += '\n';
    //     this.showToast(this.dataSend);
    //
    //     this.bluetoothSerial.write(this.dataSend).then(success => {
    //         this.showToast(success);
    //     }, error => {
    //         this.showError(error);
    //     });
    // }

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
