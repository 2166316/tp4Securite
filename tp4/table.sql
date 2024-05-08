drop  TABLE tp4securite.utilisateur;
CREATE TABLE tp4securite.utilisateur (
  "id" int AUTO_INCREMENT,
  "nom" varchar(100) DEFAULT NULL,
  "login" varchar(100) DEFAULT NULL,
  "adresse" varchar(255) DEFAULT NULL,
  "email" varchar(255) DEFAULT NULL,
  "mot_de_passe" varchar(255) DEFAULT NULL,
  PRIMARY KEY ("id")
);
select * from tp4securite.utilisateur;
insert into tp4securite.utilisateur (nom,login,adresse,email,mot_de_passe) values ('','Patrick','','','$2a$12$20pLmF38Ljm7ZwSEamB29eT5lshWLKV4huS4k/jaqhk3AEqPLM3HO');