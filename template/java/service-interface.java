package NAMESPACE;

import com.ugeez.commons.mybatisplus.service.IEnhanceService;
import ENTITY_NAMESPACE.ENTITY_NAME;

import java.util.Map;

public interface ENTITY_NAMEService extends IEnhanceService<ENTITY_NAME> {

    ENTITY_NAME create(Long userId, Map<String, Object> biz);

    ENTITY_NAME getLatestByUserId(Long userId);
}