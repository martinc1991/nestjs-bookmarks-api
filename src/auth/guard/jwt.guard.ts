import { AuthGuard } from '@nestjs/passport';
import { STRATEGY_NAME } from '../../constants';

export class JwtGuard extends AuthGuard(STRATEGY_NAME) {
  constructor() {
    super();
  }
}
