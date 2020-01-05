import { Component, NgZone, OnDestroy } from '@angular/core';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
import { AlertController, ToastController } from '@ionic/angular';
import { takeUntil } from 'rxjs/operators';
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

const mockServiceSuccess: ServiceSuccess = {
    status: 'services',
    services: ['4FAFC201-1FB5-459E-8FCC-C5C9C331914B'],
    name: 'BIERDECKEL',
    address: 'EF2072DC-32E9-41BE-CA65-B1DCED74520E',
};

const mockCharacteristicsSuccess = {
    status: 'characteristics',
    characteristics: [
        {
            properties: {write: true, read: true},
            uuid: 'BEB5483E-36E1-4688-B7F5-EA07361B26A8',
        },
    ],
    name: 'BIERDECKEL',
    service: '4FAFC201-1FB5-459E-8FCC-C5C9C331914B',
    address: 'EF2072DC-32E9-41BE-CA65-B1DCED74520E',
};

interface ServiceSuccess {
    'status': 'services';
    'services': string[];
    'name': string;
    'address': string;
}

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnDestroy {
    pairableDevices: Device[] = [];

    pairedDeviceID = '';
    pressureData = 0;

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
                    // Turn the base64 string into an array of unsigned 8bit integers
                    const decoded = atob(res.value);
                    this._zone.run(() => {
                        // tslint:disable-next-line:radix
                        this.pressureData = minMax(parseInt(decoded), 4000, 0);
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

function minMax(val, max, min) {
    return Math.floor((val - min) / (max - min) * 100);
}
