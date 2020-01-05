package NAMESPACE;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import REPOSITORY_NAMESPACE;
import ENTITY_NAMESPACE;

@Service(value = "SERVICE_NAME")
public class FILE_NAME {

    @Autowired
    private REPOSITORY_CLASS REPOSITORY;

    public ENTITY_CLASS findOne(String id) {
        return REPOSITORY.findById(id);
    }
}