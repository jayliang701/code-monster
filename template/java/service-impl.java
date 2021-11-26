package NAMESPACE;

import com.ugeez.commons.mybatisplus.service.impl.AbstractServiceImpl;
import INTERFACE_NAMESPACE.ENTITY_NAMEService;
import MAPPER_NAMESPACE.ENTITY_NAMEMapper;
import ENTITY_NAMESPACE.ENTITY_NAME;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ENTITY_NAMEServiceImpl extends AbstractServiceImpl<ENTITY_NAMEMapper, ENTITY_NAME> implements ENTITY_NAMEService {

    @Override
    public ENTITY_NAME create(Long userId, Map<String, Object> biz) {
        ENTITY_NAME doc = new ENTITY_NAME();
        doc.setUserId(userId);
        if (biz == null) {
            biz = new HashMap<>();
        }
        doc.setBiz(biz);

        this.save(doc);

        return doc;
    }

    @Override
    public ENTITY_NAME getLatestByUserId(Long userId) {
        return this.baseMapper.selectLatestByUserId(userId);
    }

}
