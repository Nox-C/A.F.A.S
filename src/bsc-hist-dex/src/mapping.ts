import { PriceData } from '../generated/schema';
import { PriceUpdated } from '../generated/DEX/DEX';

export function handlePriceUpdated(event: PriceUpdated): void {
    let priceData = new PriceData(event.params.dexAddress.toHex() + '-' + event.params.asset);
    priceData.dexAddress = event.params.dexAddress;
    priceData.asset = event.params.asset;
    priceData.price = event.params.price;
    priceData.timestamp = event.block.timestamp;
    priceData.save();
}
