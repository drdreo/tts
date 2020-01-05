import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-beer-indicator',
    templateUrl: './beer-indicator.component.html',
    styleUrls: ['./beer-indicator.component.scss'],
})
export class BeerIndicatorComponent implements OnInit {

    _height: number;

    @Input('height')
    set height(value: number) {
        this._height = value > 100 ? 100 : value;
    }

    get height() {
        return this._height;
    }

    constructor() { }

    ngOnInit() {}

}
