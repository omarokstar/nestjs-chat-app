import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

// Radius is NOT accepted from the client; it comes from app_settings.
export class NearbyQueryDto extends PaginationQueryDto {}