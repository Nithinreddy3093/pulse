import { marketDataService } from './marketDataService';
import type { DemoScenario } from '../../src/types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'nvda_surge',
    name: 'NVIDIA Major Surge (+8.4%, 2.7× Volume, Earnings)',
    description: 'Simulates a major post-earnings breakout with heavy volume and high news velocity.',
    badge: 'Major Change',
  },
  {
    id: 'tsla_dip',
    name: 'Tesla Volatility Spike (-5.2%, Regulatory Notice)',
    description: 'Simulates an unusual sharp decline on high volume triggered by regulatory scrutiny.',
    badge: 'Important',
  },
  {
    id: 'quiet_market',
    name: 'Quiet Market Session (All Caught Up)',
    description: 'Simulates normal low-volatility drift across all stocks to trigger the all-caught-up state.',
    badge: 'Normal',
  },
];

class DemoService {
  private activeScenario: string | null = null;

  public getActiveScenario(): string | null {
    return this.activeScenario;
  }

  public activateScenario(scenarioId: string): { success: boolean; scenario: string } {
    this.activeScenario = scenarioId;

    if (scenarioId === 'nvda_surge') {
      // NVDA: $160.00 -> $173.42 (+8.39%)
      // Volume: 131M (2.7x average of 48.5M)
      marketDataService.setStockOverride('NVDA', {
        price: 173.42,
        volume: 131000000,
        source: 'Demo Simulator — Market Event Feed',
        freshness: 'live',
      });
      marketDataService.setDiscrepancyFlag('NVDA', null);
    } else if (scenarioId === 'tsla_dip') {
      // TSLA: drops to $232.70 (-5.2%) on 2.2x volume
      marketDataService.setStockOverride('TSLA', {
        price: 232.70,
        volume: 143000000,
        source: 'Demo Simulator — Regulatory Dip Feed',
        freshness: 'live',
      });
    } else if (scenarioId === 'quiet_market') {
      // All stocks tightly bound to normal movement (all scores < 30)
      marketDataService.clearAllOverrides();
      marketDataService.setStockOverride('NVDA', { price: 160.30, volume: 46000000, source: 'Demo Simulator — Low Volatility' });
      marketDataService.setStockOverride('AAPL', { price: 228.60, volume: 38000000, source: 'Demo Simulator — Low Volatility' });
      marketDataService.setStockOverride('TSLA', { price: 245.80, volume: 62000000, source: 'Demo Simulator — Low Volatility' });
      marketDataService.setStockOverride('MSFT', { price: 448.90, volume: 18000000, source: 'Demo Simulator — Low Volatility' });
    } else if (scenarioId === 'stale_mode') {
      marketDataService.setForcedFreshness('stale');
      marketDataService.setDiscrepancyFlag('NVDA', 'Consolidated Tape reports $173.42 whereas Direct ATS reports $171.10.');
    }

    return { success: true, scenario: scenarioId };
  }

  public resetDemo(): void {
    this.activeScenario = null;
    marketDataService.clearAllOverrides();
  }
}

export const demoService = new DemoService();
