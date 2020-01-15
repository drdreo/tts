import { Component, NgZone, OnDestroy } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
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

interface ServiceSuccess {
    'status': 'services';
    'services': string[];
    'name': string;
    'address': string;
}

interface BtnData {
    pay: boolean;
    waiter: boolean;
    drinks: boolean;
    food: boolean;
}

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
})
export class Tab2Page implements OnDestroy {
    pairableDevices: Device[] = [];

    pairedDeviceID = '';
    buttonData: BtnData = {
        pay: false,
        waiter: false,
        drinks: false,
        food: false,
    };

    private unsubscribe$ = new Subject();

    constructor(private toast: ToastController,
                private alertCtrl: AlertController,
                private _zone: NgZone,
                public bluetoothle: BluetoothLE) {

        const params = {
            request: true,
            statusReceiver: false,
            restoreKey: 'bluetoothleplugin',
        };

        this.bluetoothle.initialize(params)
            .subscribe(ble => {
                console.log('ble', ble.status); // logs 'enabled'
            });

        setInterval(() => {
            // waiter:0;drinks:0;food:1;pay:1
            this.buttonData = parseBtnData('waiter:0;drinks:0;food:1;pay:1');
        }, 1000);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();

        this.bluetoothle.disconnect({address: this.pairedDeviceID});
        this.bluetoothle.close({address: this.pairedDeviceID});
    }

    scanDevices() {
        const scanParams = {};

        this.bluetoothle.startScan(scanParams)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((scanStatus: any) => {
                console.log(scanStatus);

                if (scanStatus.address && !this.pairableDevices.some(device => device.address === scanStatus.address)) {
                    let name = scanStatus.name;

                    if (name.length === 0) {
                        name = 'No name';
                        if (scanStatus.advertisement && scanStatus.advertisement.localName && scanStatus.advertisement.localName.length) {
                            name = scanStatus.advertisement.localName;
                        }
                    }
                    console.log('adding device: ', {name, address: scanStatus.address});
                    this._zone.run(() => {
                        this.pairableDevices.push({name, address: scanStatus.address});
                    });
                } else {
                    console.log('Device address is undefined');
                }

                if (scanStatus.advertisement && scanStatus.advertisement.serviceUuids.some(uuid => uuid === '4FAFC201-1FB5-459E-8FCC-C5C9C331914B')) {
                    this.showToast('Our Arduino was found!');
                }
            }, (error) => {
                this.showError(error.message);
            });

        // auto stop scanning after 5s
        setTimeout(() => {
            console.log('Stopping scanning!');
            this.bluetoothle.stopScan();
        }, 30000);
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
        this.bluetoothle.stopScan();
        this.connect(address);
    }

    connect(address) {
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothle.connect({address})
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.deviceConnected();
            }, error => {
                console.log(error);
                this.showError('Error:Connecting to Device');
            });
    }

    deviceConnected() {
        this.getDeviceServices(this.pairedDeviceID);
    }

    getDeviceServices(address: string) {
        this.bluetoothle.services({address}).then((result: ServiceSuccess) => this.discoverSuccess(result, address));
    }

    discoverSuccess(result: ServiceSuccess, address: string) {
        console.log('Discover returned with status: ' + result.status);
        console.log(result);

        this.bluetoothle.characteristics({
            address,
            service: result.services[0], // what SERVICE FUCKING ID
            characteristics: [],
        }).then(cResult => this.characteristicsSuccess(cResult));
    }

    characteristicsSuccess(result) {
        console.log('Characteristics returned with status: ' + result.status);
        console.log(result);

        setInterval(() => {
            this.bluetoothle.read({address: result.address, service: result.service, characteristic: result.characteristics[0].uuid})
                .then((res) => {
                    console.log('reading...');
                    console.log(res);
                    const decoded = atob(res.value);
                    this._zone.run(() => {
                        // Turn the base64 string into an array of unsigned 8bit integers
                        this.buttonData = parseBtnData(decoded);
                    });
                    this.handleData(decoded);
                });
        }, 1000);
    }

    private handleData(data) {
        this.showToast(data);
    }

    private async showToast(message: string): Promise<void> {
        const toast = await this.toast.create({
            color: 'dark',
            message,
            duration: 3000,
        });
        return toast.present();
    }

    private async showError(message: string): Promise<void> {
        const toast = await this.toast.create({
            color: 'danger',
            message,
            showCloseButton: true,
        });
        return toast.present();
    }

}

// decodes the string format:  waiter:0;drinks:1;food:0;pay:1
function parseBtnData(encoded: string): BtnData {

    const data = {
        pay: false,
        waiter: false,
        drinks: false,
        food: false,
    };

    const buttons = encoded.split(';');

    for (const button of buttons) {
        const split = button.split(':');
        const value = split[1];
        data[split[0]] = value === '1';
    }
    return data;
}
