import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity.js';
import { SETTING_KEYS } from './settings.constatnts.js';

const DEFAULT_RADIUS_KM = 10;

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>) {}

  async getRadiusKm(): Promise<number> {
    const setting = await this.repo.findOne({ where: { key: SETTING_KEYS.SEARCH_RADIUS_KM } });
    const value = Number(setting?.value);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_RADIUS_KM;
  }

  async setRadiusKm(radiusKm: number, updatedBy: string): Promise<{ radiusKm: number }> {
    await this.repo.save(
      this.repo.create({ key: SETTING_KEYS.SEARCH_RADIUS_KM, value: String(radiusKm), updatedBy }),
    );
    return { radiusKm };
  }
}